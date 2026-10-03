import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
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

const VAA_PATH =
  "artifacts/cross-chain/vaa.json";

const SIGNATURE_KEYPAIR_PATH =
  "artifacts/cross-chain/guardian-signatures-keypair.json";

function instructionDiscriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

async function main() {
  console.log("Posting real Wormhole guardian signatures...");

  const vaa = JSON.parse(
    fs.readFileSync(VAA_PATH, "utf8"),
  );

  const secretKey = Uint8Array.from(
    JSON.parse(
      fs.readFileSync(WALLET_PATH, "utf8"),
    ),
  );

  const payer = Keypair.fromSecretKey(secretKey);

  const connection = new Connection(
    RPC_URL,
    "confirmed",
  );

  const guardianSetIndex = vaa.guardianSetIndex;
  const signatures = vaa.signatures;

  console.log("Payer:", payer.publicKey.toBase58());
  console.log("Guardian set index:", guardianSetIndex);
  console.log("Signature count:", signatures.length);

  if (signatures.length === 0) {
    throw new Error(
      "VAA contains no guardian signatures",
    );
  }

  for (const [index, signature] of signatures.entries()) {
    if (!Array.isArray(signature) || signature.length !== 66) {
      throw new Error(
        `Guardian signature ${index} must contain exactly 66 bytes`,
      );
    }
  }

  // Generate the temporary guardian-signatures account.
  const guardianSignatures = Keypair.generate();

  console.log(
    "Guardian signatures account:",
    guardianSignatures.publicKey.toBase58(),
  );

  // --------------------------------------------------
  // Anchor instruction data
  //
  // post_signatures(
  //   guardian_set_index: u32,
  //   total_signatures: u8,
  //   guardian_signatures: Vec<[u8; 66]>
  // )
  // --------------------------------------------------

  const signatureBytes = signatures.flat();

  const instructionData = Buffer.alloc(
    8 +
      4 +
      1 +
      4 +
      signatureBytes.length,
  );

  let offset = 0;

  // Anchor discriminator
  instructionDiscriminator(
    "post_signatures",
  ).copy(instructionData, offset);

  offset += 8;

  // guardian_set_index: u32 LE
  instructionData.writeUInt32LE(
    guardianSetIndex,
    offset,
  );

  offset += 4;

  // total_signatures: u8
  instructionData.writeUInt8(
    signatures.length,
    offset,
  );

  offset += 1;

  // Vec length: u32 LE
  instructionData.writeUInt32LE(
    signatures.length,
    offset,
  );

  offset += 4;

  // [u8; 66] * N
  Buffer.from(signatureBytes).copy(
    instructionData,
    offset,
  );

  // --------------------------------------------------
  // Accounts
  // --------------------------------------------------

  const instruction =
    new TransactionInstruction({
      programId: SHIM_PROGRAM_ID,

      keys: [
        {
          // payer
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          // guardian_signatures
          pubkey: guardianSignatures.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          // system_program
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],

      data: instructionData,
    });

  const transaction =
    new Transaction().add(instruction);

  const tx =
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [
        payer,
        guardianSignatures,
      ],
      {
        commitment: "confirmed",
      },
    );

  // Save the temporary account keypair for the
  // following consume/close steps.
  fs.writeFileSync(
    SIGNATURE_KEYPAIR_PATH,
    JSON.stringify(
      Array.from(
        guardianSignatures.secretKey,
      ),
    ),
  );

  console.log("");
  console.log("======================================");
  console.log("GUARDIAN SIGNATURES POSTED");
  console.log("======================================");
  console.log(
    "Guardian signatures account:",
    guardianSignatures.publicKey.toBase58(),
  );
  console.log(
    "Guardian set index:",
    guardianSetIndex,
  );
  console.log(
    "Signature count:",
    signatures.length,
  );
  console.log("Transaction:", tx);
  console.log(
    "Keypair saved:",
    SIGNATURE_KEYPAIR_PATH,
  );
  console.log("======================================");
}

main().catch((error) => {
  console.error("");
  console.error("Posting signatures failed:");
  console.error(error);

  if (error?.transactionLogs) {
    console.error("");
    console.error("Transaction logs:");
    console.error(error.transactionLogs);
  }

  process.exit(1);
});
