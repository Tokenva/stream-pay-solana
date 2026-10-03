import {
  Connection,
  Keypair,
  PublicKey,
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

const DEPOSITOR_TOKEN_ACCOUNT = new PublicKey(
  "SEBGF34CytXB1Eux6Kzq6jRN5RjR57wq8HdZLMpoVPR",
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

  const depositor = loadKeypair(WALLET_PATH);

  const [vault] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const amount = 2000n;

  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amount);

  const data = Buffer.concat([
    discriminator("deposit"),
    amountBuffer,
  ]);

  const instruction =
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        {
          pubkey: depositor.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: ORGANIZATION,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: DEPOSITOR_TOKEN_ACCOUNT,
          isSigner: false,
          isWritable: true,
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
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],
      data,
    });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(
      "confirmed",
    );

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: depositor.publicKey,
  }).add(instruction);

  transaction.sign(depositor);

  const simulation =
    await connection.simulateTransaction(
      transaction,
    );

  console.log("Simulation error:", simulation.value.err);
  console.log("Simulation logs:", simulation.value.logs);

  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
    );
  }

  const signature =
    await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
      },
    );

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

  console.log("Vault:", vault.toBase58());
  console.log("Deposited base units:", amount.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
