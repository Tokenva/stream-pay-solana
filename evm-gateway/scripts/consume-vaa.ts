import {
  ComputeBudgetProgram,
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

const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

const WORMHOLE_VERIFY_VAA_SHIM = new PublicKey(
  "EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at",
);

const CROSS_CHAIN_CONFIG_SEED = Buffer.from("cross-chain");
const CONSUMED_VAA_SEED = Buffer.from("vaa");

const WALLET_PATH =
  `${process.env.HOME}/.config/solana/id.json`;

const VAA_PATH =
  "artifacts/cross-chain/vaa.json";

const VAA_BODY_PATH =
  "artifacts/cross-chain/vaa-body.bin";

const SIGNATURE_KEYPAIR_PATH =
  "artifacts/cross-chain/guardian-signatures-keypair.json";

function instructionDiscriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

async function main() {
  console.log("Consuming real Wormhole VAA...");

  // --------------------------------------------------
  // Load wallet
  // --------------------------------------------------

  const walletSecret = Uint8Array.from(
    JSON.parse(
      fs.readFileSync(WALLET_PATH, "utf8"),
    ),
  );

  const payer = Keypair.fromSecretKey(walletSecret);

  const connection = new Connection(
    RPC_URL,
    "confirmed",
  );

  // --------------------------------------------------
  // Load VAA metadata/body
  // --------------------------------------------------

  const vaa = JSON.parse(
    fs.readFileSync(VAA_PATH, "utf8"),
  );

  const vaaBody = fs.readFileSync(
    VAA_BODY_PATH,
  );

  console.log("Payer:", payer.publicKey.toBase58());
  console.log("VAA version:", vaa.version);
  console.log(
    "Guardian set index:",
    vaa.guardianSetIndex,
  );
  console.log(
    "Guardian signatures:",
    vaa.signatureCount,
  );
  console.log(
    "VAA body bytes:",
    vaaBody.length,
  );

  if (vaaBody.length !== 467) {
    throw new Error(
      `Expected 467-byte VAA body, got ${vaaBody.length}`,
    );
  }

  // --------------------------------------------------
  // Read Wormhole VAA sequence
  //
  // VAA body:
  //
  // 0..7    timestamp
  // 8..9    emitter chain
  // 10..41  emitter address
  // 42..49  sequence
  // 50      consistency
  // 51..    payload
  // --------------------------------------------------

  const sequence = vaaBody.readBigUInt64BE(42);

  console.log(
    "VAA sequence:",
    sequence.toString(),
  );

  // --------------------------------------------------
  // Trusted CrossChainConfig PDA
  // --------------------------------------------------

  const [crossChainConfig, crossChainBump] =
    PublicKey.findProgramAddressSync(
      [CROSS_CHAIN_CONFIG_SEED],
      PROGRAM_ID,
    );

  console.log(
    "CrossChainConfig:",
    crossChainConfig.toBase58(),
  );

  console.log(
    "Cross-chain bump:",
    crossChainBump,
  );

  // --------------------------------------------------
  // Guardian Set PDA
  //
  // guardian_set_index = 0
  // stored as big-endian u32
  // --------------------------------------------------

  const guardianSetIndexBuffer =
    Buffer.alloc(4);

  guardianSetIndexBuffer.writeUInt32BE(
    Number(vaa.guardianSetIndex),
    0,
  );

  const CORE_BRIDGE_PROGRAM_ID =
    new PublicKey(
      "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
    );

  const [guardianSet, guardianSetBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("GuardianSet"),
        guardianSetIndexBuffer,
      ],
      CORE_BRIDGE_PROGRAM_ID,
    );

  console.log(
    "Guardian Set:",
    guardianSet.toBase58(),
  );

  console.log(
    "Guardian Set bump:",
    guardianSetBump,
  );

  // --------------------------------------------------
  // Guardian signatures account
  // --------------------------------------------------

  const signatureSecret = Uint8Array.from(
    JSON.parse(
      fs.readFileSync(
        SIGNATURE_KEYPAIR_PATH,
        "utf8",
      ),
    ),
  );

  const guardianSignatures =
    Keypair.fromSecretKey(signatureSecret);

  console.log(
    "Guardian signatures account:",
    guardianSignatures.publicKey.toBase58(),
  );

  // --------------------------------------------------
  // ConsumedVaa PDA
  //
  // seeds:
  // ["vaa", trusted_emitter, sequence_le]
  // --------------------------------------------------

  const sourceEmitter = Buffer.from(
    vaa.sourceEmitter ??
      "00000000000000000000000013a5b0be7f5841ac2cb0d07e71bb4209f469f104",
    "hex",
  );

  if (sourceEmitter.length !== 32) {
    throw new Error(
      "Source emitter must be exactly 32 bytes",
    );
  }

  const sequenceLe = Buffer.alloc(8);

  sequenceLe.writeBigUInt64LE(
    sequence,
    0,
  );

  const [consumedVaa, consumedVaaBump] =
    PublicKey.findProgramAddressSync(
      [
        CONSUMED_VAA_SEED,
        sourceEmitter,
        sequenceLe,
      ],
      PROGRAM_ID,
    );

  console.log(
    "ConsumedVaa PDA:",
    consumedVaa.toBase58(),
  );

  console.log(
    "ConsumedVaa bump:",
    consumedVaaBump,
  );

  // --------------------------------------------------
  // Replay protection check
  // --------------------------------------------------

  const existingConsumed =
    await connection.getAccountInfo(
      consumedVaa,
    );

  if (existingConsumed) {
    console.log("");
    console.log(
      "This VAA sequence has already been consumed.",
    );
    console.log(
      "ConsumedVaa:",
      consumedVaa.toBase58(),
    );
    return;
  }

  // --------------------------------------------------
  // Anchor instruction data
  //
  // consume_vaa(
  //   guardian_set_bump: u8,
  //   sequence: u64,
  //   vaa_body: Vec<u8>
  // )
  // --------------------------------------------------

  const discriminator =
    instructionDiscriminator(
      "consume_vaa",
    );

  const vaaLengthPrefix =
    Buffer.alloc(4);

  vaaLengthPrefix.writeUInt32LE(
    vaaBody.length,
    0,
  );

  const sequenceBuffer =
    Buffer.alloc(8);

  sequenceBuffer.writeBigUInt64LE(
    sequence,
    0,
  );

  const instructionData = Buffer.concat([
    discriminator,

    // guardian_set_bump: u8
    Buffer.from([guardianSetBump]),

    // sequence: u64 LE
    sequenceBuffer,

    // vaa_body: Vec<u8>
    vaaLengthPrefix,
    vaaBody,
  ]);

  // --------------------------------------------------
  // Accounts
  //
  // Must exactly match:
  //
  // payer
  // cross_chain_config
  // guardian_set
  // guardian_signatures
  // wormhole_verify_vaa_shim
  // consumed_vaa
  // system_program
  // --------------------------------------------------

  const instruction =
    new TransactionInstruction({
      programId: PROGRAM_ID,

      keys: [
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: crossChainConfig,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: guardianSet,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: guardianSignatures.publicKey,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: WORMHOLE_VERIFY_VAA_SHIM,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: consumedVaa,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],

      data: instructionData,
    });

  // --------------------------------------------------
  // Compute budget
  // --------------------------------------------------

  const computeBudget =
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 420_000,
    });

  const transaction = new Transaction()
    .add(computeBudget)
    .add(instruction);

  console.log("");
  console.log(
    "Submitting consume_vaa transaction...",
  );

  const signature =
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      {
        commitment: "confirmed",
      },
    );

  console.log("");
  console.log("======================================");
  console.log("VAA CONSUMED SUCCESSFULLY");
  console.log("======================================");
  console.log(
    "VAA sequence:",
    sequence.toString(),
  );
  console.log(
    "Guardian Set:",
    guardianSet.toBase58(),
  );
  console.log(
    "ConsumedVaa:",
    consumedVaa.toBase58(),
  );
  console.log(
    "Transaction:",
    signature,
  );
  console.log("======================================");
}

main().catch((error) => {
  console.error("");
  console.error("consume_vaa failed:");
  console.error(error);

  if (error?.transactionLogs) {
    console.error("");
    console.error("Transaction logs:");
    console.error(error.transactionLogs);
  }

  process.exit(1);
});
