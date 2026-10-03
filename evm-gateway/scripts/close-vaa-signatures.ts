import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { createHash } from "crypto";
import fs from "fs";

const RPC_URL = "https://api.devnet.solana.com";

const SHIM_PROGRAM_ID = new PublicKey(
  "EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at",
);

const WALLET_PATH =
  `${process.env.HOME}/.config/solana/id.json`;

const SIGNATURE_KEYPAIR_PATH =
  "artifacts/cross-chain/guardian-signatures-keypair.json";

function instructionDiscriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

async function main() {
  const secretKey = Uint8Array.from(
    JSON.parse(
      fs.readFileSync(WALLET_PATH, "utf8"),
    ),
  );

  const payer = Keypair.fromSecretKey(secretKey);

const guardianSignatures = new PublicKey(
  "9kA8pCRrFiEJuX1Nqf7zSAuQrDhhhLTRvM3i2dV9R27w",
);

  const connection = new Connection(
    RPC_URL,
    "confirmed",
  );

  console.log(
    "Guardian signatures account:",
    guardianSignatures.toBase58(),
  );

  const account = await connection.getAccountInfo(
    guardianSignatures,
  );

  if (!account) {
    console.log("Guardian signatures account does not exist.");
    return;
  }

  const instruction = new TransactionInstruction({
    programId: SHIM_PROGRAM_ID,
    keys: [
      {
        pubkey: guardianSignatures,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: payer.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    data: instructionDiscriminator("close_signatures"),
  });

  const tx = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
    { commitment: "confirmed" },
  );

  console.log("");
  console.log("======================================");
  console.log("GUARDIAN SIGNATURES CLOSED");
  console.log("======================================");
  console.log("Transaction:", tx);
  console.log("======================================");
}

main().catch((error) => {
  console.error("Close failed:");
  console.error(error);

  if (error?.transactionLogs) {
    console.error(error.transactionLogs);
  }

  process.exit(1);
});
