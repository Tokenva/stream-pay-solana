import crypto from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { pool } from "./db.js";

const NONCE_TTL_MINUTES = 10;
const SESSION_TTL_DAYS = 30;

function base64UrlEncode(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createToken() {
  return base64UrlEncode(
    crypto.randomBytes(32),
  );
}

function createNonce() {
  return crypto.randomBytes(24).toString("hex");
}

function createMessage(
  wallet: string,
  nonce: string,
) {
  return [
    "Tokenva Authentication",
    "",
    "Sign this message to authenticate with Tokenva.",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

function publicKeyObject(wallet: string) {
  const publicKey = new PublicKey(wallet);

  const derPrefix = Buffer.from([
    0x30, 0x2a,
    0x30, 0x05,
    0x06, 0x03,
    0x2b, 0x65, 0x70,
    0x03, 0x21, 0x00,
  ]);

  return crypto.createPublicKey({
    key: Buffer.concat([
      derPrefix,
      Buffer.from(publicKey.toBytes()),
    ]),
    format: "der",
    type: "spki",
  });
}

export async function createAuthNonce(
  wallet: string,
) {
  new PublicKey(wallet);

  const nonce = createNonce();

  await pool.query(
    `
    DELETE FROM auth_nonces
    WHERE wallet = $1
       OR expires_at < NOW()
    `,
    [wallet],
  );

  await pool.query(
    `
    INSERT INTO auth_nonces (
      wallet,
      nonce,
      expires_at
    )
    VALUES (
      $1,
      $2,
      NOW() + INTERVAL '${NONCE_TTL_MINUTES} minutes'
    )
    `,
    [wallet, nonce],
  );

  return {
    nonce,
    message: createMessage(wallet, nonce),
  };
}

export async function authenticateWallet(input: {
  wallet: string;
  nonce: string;
  signature: string;
}) {
  const result = await pool.query(
    `
    SELECT nonce
    FROM auth_nonces
    WHERE wallet = $1
      AND nonce = $2
      AND expires_at > NOW()
    LIMIT 1
    `,
    [input.wallet, input.nonce],
  );

  if (!result.rows[0]) {
    throw new Error("Invalid or expired nonce");
  }

  const signature = Buffer.from(
    input.signature,
    "base64",
  );

  if (signature.length !== 64) {
    throw new Error("Invalid signature");
  }

  const message = createMessage(
    input.wallet,
    input.nonce,
  );

  const valid = crypto.verify(
    null,
    Buffer.from(message),
    publicKeyObject(input.wallet),
    signature,
  );

  if (!valid) {
    throw new Error("Invalid wallet signature");
  }

  await pool.query(
    `
    DELETE FROM auth_nonces
    WHERE wallet = $1
      AND nonce = $2
    `,
    [input.wallet, input.nonce],
  );

  const sessionToken = createToken();

  await pool.query(
    `
    INSERT INTO auth_sessions (
      wallet,
      session_token,
      expires_at
    )
    VALUES (
      $1,
      $2,
      NOW() + INTERVAL '${SESSION_TTL_DAYS} days'
    )
    `,
    [input.wallet, sessionToken],
  );

  return {
    sessionToken,
    wallet: input.wallet,
  };
}

export async function getSession(
  sessionToken: string,
) {
  const result = await pool.query(
    `
    SELECT
      wallet,
      expires_at
    FROM auth_sessions
    WHERE session_token = $1
      AND expires_at > NOW()
    LIMIT 1
    `,
    [sessionToken],
  );

  return result.rows[0] ?? null;
}

export async function deleteSession(
  sessionToken: string,
) {
  await pool.query(
    `
    DELETE FROM auth_sessions
    WHERE session_token = $1
    `,
    [sessionToken],
  );
}
