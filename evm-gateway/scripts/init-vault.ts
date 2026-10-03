import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import { createHash } from "crypto";
import fs from "fs";

const RPC_URL = "https://api.devnet.solana.com";

const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

const ORGANIZATION = new PublicKey(
  "AhxBRoQmi1mAZNfBmkEB9WjSEBr48SaTyQWaLKM13YVG",
);

const MINT = new PublicKey(
  "6jDvPYSs5qerGyXe3G2FLpFJhFQHHvjbkj9Xi9jYDxhB",
);

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

const WALLET_PATH =
  `${process.env.HOME}/.config/solana/id.json`;

function discriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

function loadKeypair(path: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync(path, "utf8")),
    ),
  );
}

async function main() {
  const connection = new Connection(
    RPC_URL,
    "confirmed",
  );

  const authority = loadKeypair(WALLET_PATH);

  const [vault, vaultBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const [vaultAuthority, vaultAuthorityBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault-authority"),
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  console.log("Authority:", authority.publicKey.toBase58());
  console.log("Organization:", ORGANIZATION.toBase58());
  console.log("Mint:", MINT.toBase58());
  console.log("Vault:", vault.toBase58());
  console.log("Vault bump:", vaultBump);
  console.log(
    "Vault authority:",
    vaultAuthority.toBase58(),
  );
  console.log(
    "Vault authority bump:",
    vaultAuthorityBump,
  );

  const existing =
    await connection.getAccountInfo(vault);

  if (existing) {
    console.log("");
    console.log("Vault already exists.");
    return;
  }

  const instruction =
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        {
          pubkey: authority.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: ORGANIZATION,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: MINT,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: vault,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: vaultAuthority,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: discriminator("initialize_vault"),
    });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(
      "confirmed",
    );

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: authority.publicKey,
  }).add(instruction);

  transaction.sign(authority);

  const signature =
    await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
      },
    );

  console.log("");
  console.log("Transaction:", signature);

  const confirmation =
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    );

  console.log(
    "Confirmation:",
    confirmation.value.err ?? "SUCCESS",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
