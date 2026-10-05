import {
  ComputeBudgetProgram,
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

const CROSS_CHAIN_ASSET_CONFIG = new PublicKey(
  "jhPuSJ7NK7vGMKE4RMwhBrJvxL4qXNQ1H8zvJSbYrJ9",
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

const ORGANIZATION_POLICY_SEED = Buffer.from(
  "organization_policy",
);

const WALLET_PATH =
  `${process.env.HOME}/.config/solana/id.json`;

const VAA_PATH =
  "artifacts/cross-chain/vaa.json";

const VAA_BODY_PATH =
  "artifacts/cross-chain/vaa-body.bin";

const NATIVE_STREAM_ID = BigInt(
  process.env.NATIVE_STREAM_ID ?? "8",
);

const VAA_HEADER_LEN = 51;
const PAYLOAD_LEN = 416;

const EMPLOYEE_OFFSET = 224;
const STREAM_ID_OFFSET = 256;

const SOURCE_EMITTER = Buffer.from(
  "00000000000000000000000013a5b0be7f5841ac2cb0d07e71bb4209f469f104",
  "hex",
);

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

  const payer = loadKeypair(WALLET_PATH);

  const vaa = JSON.parse(
    fs.readFileSync(VAA_PATH, "utf8"),
  );

  const vaaBody = fs.readFileSync(
    VAA_BODY_PATH,
  );

  console.log("Payer:", payer.publicKey.toBase58());
  console.log(
    "Native stream ID:",
    NATIVE_STREAM_ID.toString(),
  );
  console.log("VAA body bytes:", vaaBody.length);

  if (vaaBody.length !== 467) {
    throw new Error(
      `Expected 467-byte VAA body, got ${vaaBody.length}`,
    );
  }

  const sequence = vaaBody.readBigUInt64BE(42);

  console.log("VAA sequence:", sequence.toString());

  const payload =
    vaaBody.subarray(VAA_HEADER_LEN);

  if (payload.length !== PAYLOAD_LEN) {
    throw new Error(
      `Expected 416-byte payload, got ${payload.length}`,
    );
  }

  const employee = new PublicKey(
    payload.subarray(
      EMPLOYEE_OFFSET,
      EMPLOYEE_OFFSET + 32,
    ),
  );

  const externalStreamId =
    Buffer.from(
      payload.subarray(
        STREAM_ID_OFFSET,
        STREAM_ID_OFFSET + 32,
      ),
    );

  console.log(
    "Employee:",
    employee.toBase58(),
  );

  console.log(
    "External stream ID:",
    `0x${externalStreamId.toString("hex")}`,
  );

  // --------------------------------------------------
  // Derive required PDAs
  // --------------------------------------------------

  const [crossChainConfig] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("cross-chain")],
      PROGRAM_ID,
    );

  console.log(
    "OrganizationPolicy:",
    organizationPolicy.toBase58(),
  );

  const [consumedVaa] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vaa"),
        SOURCE_EMITTER,
        (() => {
          const b = Buffer.alloc(8);
          b.writeBigUInt64LE(sequence);
          return b;
        })(),
      ],
      PROGRAM_ID,
    );

  const [vault] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const [vaultAuthority] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault-authority"),
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const [crossChainStream] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross-stream"),
        externalStreamId,
      ],
      PROGRAM_ID,
    );

  const nativeStreamIdBuffer =
    Buffer.alloc(8);

  nativeStreamIdBuffer.writeBigUInt64LE(
    NATIVE_STREAM_ID,
  );

  const [stream] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("stream"),
        ORGANIZATION.toBuffer(),
        employee.toBuffer(),
        nativeStreamIdBuffer,
      ],
      PROGRAM_ID,
    );

  const [streamEscrow] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("stream-escrow"),
        stream.toBuffer(),
      ],
      PROGRAM_ID,
    );

  console.log("");
  console.log("CrossChainConfig:", crossChainConfig.toBase58());
  console.log("ConsumedVaa:", consumedVaa.toBase58());
  console.log("CrossChainAssetConfig:", CROSS_CHAIN_ASSET_CONFIG.toBase58());
  console.log("Organization:", ORGANIZATION.toBase58());
  console.log("Vault:", vault.toBase58());
  console.log("Vault authority:", vaultAuthority.toBase58());
  console.log("CrossChainStream:", crossChainStream.toBase58());
  console.log("Native Stream:", stream.toBase58());
  console.log("Stream escrow:", streamEscrow.toBase58());

  // --------------------------------------------------
  // Verify consumed VAA exists
  // --------------------------------------------------

  const consumedInfo =
    await connection.getAccountInfo(
      consumedVaa,
    );

  if (consumedInfo === null) {
    throw new Error(
      "ConsumedVaa account was not found",
    );
  }

  // --------------------------------------------------
  // Verify target accounts do not already exist
  // --------------------------------------------------

  const streamInfo =
    await connection.getAccountInfo(stream);

  const crossStreamInfo =
    await connection.getAccountInfo(
      crossChainStream,
    );

  if (streamInfo !== null) {
    throw new Error(
      `Native Stream already exists: ${stream.toBase58()}`,
    );
  }

  if (crossStreamInfo !== null) {
    throw new Error(
      `CrossChainStream already exists: ${crossChainStream.toBase58()}`,
    );
  }

  // --------------------------------------------------
  // execute_cross_chain_action(
  //   sequence: u64,
  //   native_stream_id: u64,
  //   vaa_body: Vec<u8>
  // )
  // --------------------------------------------------

  const sequenceBuffer =
    Buffer.alloc(8);

  sequenceBuffer.writeBigUInt64LE(
    sequence,
  );

  const nativeStreamIdBuffer2 =
    Buffer.alloc(8);

  nativeStreamIdBuffer2.writeBigUInt64LE(
    NATIVE_STREAM_ID,
  );

  const vaaLengthBuffer =
    Buffer.alloc(4);

  vaaLengthBuffer.writeUInt32LE(
    vaaBody.length,
    0,
  );

  const instructionData =
    Buffer.concat([
      discriminator(
        "execute_cross_chain_action",
      ),
      sequenceBuffer,
      nativeStreamIdBuffer2,
      vaaLengthBuffer,
      vaaBody,
    ]);

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
          pubkey: consumedVaa,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: CROSS_CHAIN_ASSET_CONFIG,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: ORGANIZATION,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: organizationPolicy,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: employee,
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
          pubkey: crossChainStream,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: stream,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: streamEscrow,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],

      data: instructionData,
    });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(
      "confirmed",
    );

  const transaction =
    new Transaction({
      recentBlockhash: blockhash,
      feePayer: payer.publicKey,
    }).add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      }),
      instruction,
    );

  transaction.sign(payer);

  // --------------------------------------------------
  // Simulate first
  // --------------------------------------------------

  console.log("");
  console.log("Simulating execute_cross_chain_action...");

  const simulation =
    await connection.simulateTransaction(
      transaction,
    );

  console.log(
    "Simulation error:",
    simulation.value.err,
  );

  console.log(
    "Simulation logs:",
    simulation.value.logs,
  );

  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(
        simulation.value.err,
      )}`,
    );
  }

  // --------------------------------------------------
  // Send after successful simulation
  // --------------------------------------------------

  const signature =
    await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
      },
    );

  console.log("");
  console.log(
    "Execute transaction:",
    signature,
  );

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

  console.log("");
  console.log("======================================");
  console.log("CROSS-CHAIN CREATE STREAM EXECUTED");
  console.log("======================================");
  console.log("Sequence:", sequence.toString());
  console.log(
    "Native stream ID:",
    NATIVE_STREAM_ID.toString(),
  );
  console.log("Employee:", employee.toBase58());
  console.log(
    "External stream ID:",
    `0x${externalStreamId.toString("hex")}`,
  );
  console.log("Native Stream:", stream.toBase58());
  console.log("Stream escrow:", streamEscrow.toBase58());
  console.log("Transaction:", signature);
  console.log("======================================");
}

main().catch((error) => {
  console.error("");
  console.error("Cross-chain execution failed:");
  console.error(error);
  process.exit(1);
});
