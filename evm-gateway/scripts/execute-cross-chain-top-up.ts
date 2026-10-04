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

const RPC_URL =
  "https://api.devnet.solana.com";

const PROGRAM_ID =
  new PublicKey(
    "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
  );

const ORGANIZATION =
  new PublicKey(
    "AhxBRoQmi1mAZNfBmkEB9WjSEBr48SaTyQWaLKM13YVG",
  );

const MINT =
  new PublicKey(
    "6jDvPYSs5qerGyXe3G2FLpFJhFQHHvjbkj9Xi9jYDxhB",
  );

const TOKEN_PROGRAM_ID =
  new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

const CROSS_CHAIN_CONFIG_SEED =
  Buffer.from("cross-chain");

const CONSUMED_VAA_SEED =
  Buffer.from("vaa");

const CROSS_CHAIN_STREAM_SEED =
  Buffer.from("cross-stream");

const STREAM_SEED =
  Buffer.from("stream");

const STREAM_ESCROW_SEED =
  Buffer.from("stream-escrow");

const VAULT_SEED =
  Buffer.from("vault");

const VAULT_AUTHORITY_SEED =
  Buffer.from("vault-authority");

const WALLET_PATH =
  `${process.env.HOME}/.config/solana/id.json`;

const VAA_PATH =
  "artifacts/cross-chain/vaa.json";

const VAA_BODY_PATH =
  "artifacts/cross-chain/vaa-body.bin";

const SOURCE_EMITTER =
  Buffer.from(
    "00000000000000000000000013a5b0be7f5841ac2cb0d07e71bb4209f469f104",
    "hex",
  );

const NATIVE_STREAM_ID =
  BigInt(
    process.env.NATIVE_STREAM_ID ?? "8",
  );

const VAA_HEADER_LEN =
  51;

const PAYLOAD_LEN =
  416;

const EMPLOYEE_OFFSET =
  224;

const STREAM_ID_OFFSET =
  256;

function discriminator(
  name: string,
): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

function loadKeypair(
  path: string,
): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync(
          path,
          "utf8",
        ),
      ),
    ),
  );
}

async function main() {
  const connection =
    new Connection(
      RPC_URL,
      "confirmed",
    );

  const payer =
    loadKeypair(
      WALLET_PATH,
    );

  const vaa =
    JSON.parse(
      fs.readFileSync(
        VAA_PATH,
        "utf8",
      ),
    );

  const vaaBody =
    fs.readFileSync(
      VAA_BODY_PATH,
    );

  console.log(
    "Payer:",
    payer.publicKey.toBase58(),
  );


  console.log(
    "Native stream ID:",
    NATIVE_STREAM_ID.toString(),
  );

  console.log(
    "VAA body bytes:",
    vaaBody.length,
  );

  if (
    vaaBody.length !== 467
  ) {
    throw new Error(
      `Expected 467-byte VAA body, got ${vaaBody.length}`,
    );
  }

  const sequence =
    vaaBody.readBigUInt64BE(42);

  console.log(
    "VAA sequence:",
    sequence.toString(),
  );

  const payload =
    vaaBody.subarray(
      VAA_HEADER_LEN,
    );

  if (
    payload.length !==
    PAYLOAD_LEN
  ) {
    throw new Error(
      `Expected 416-byte payload, got ${payload.length}`,
    );
  }

  const employee =
    new PublicKey(
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

  const sequenceLe =
    Buffer.alloc(8);

  sequenceLe.writeBigUInt64LE(
    sequence,
    0,
  );

  const nativeStreamIdLe =
    Buffer.alloc(8);

  nativeStreamIdLe.writeBigUInt64LE(
    NATIVE_STREAM_ID,
    0,
  );

  const [
    crossChainConfig,
  ] =
    PublicKey.findProgramAddressSync(
      [
        CROSS_CHAIN_CONFIG_SEED,
      ],
      PROGRAM_ID,
    );

  const [
    consumedVaa,
  ] =
    PublicKey.findProgramAddressSync(
      [
        CONSUMED_VAA_SEED,
        SOURCE_EMITTER,
        sequenceLe,
      ],
      PROGRAM_ID,
    );

  const [
    crossChainStream,
  ] =
    PublicKey.findProgramAddressSync(
      [
        CROSS_CHAIN_STREAM_SEED,
        externalStreamId,
      ],
      PROGRAM_ID,
    );

  const [
    vault,
  ] =
    PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const [
    vaultAuthority,
  ] =
    PublicKey.findProgramAddressSync(
      [
        VAULT_AUTHORITY_SEED,
        ORGANIZATION.toBuffer(),
        MINT.toBuffer(),
      ],
      PROGRAM_ID,
    );

  const [
    stream,
  ] =
    PublicKey.findProgramAddressSync(
      [
        STREAM_SEED,
        ORGANIZATION.toBuffer(),
        employee.toBuffer(),
        nativeStreamIdLe,
      ],
      PROGRAM_ID,
    );

  const [
    streamEscrow,
  ] =
    PublicKey.findProgramAddressSync(
      [
        STREAM_ESCROW_SEED,
        stream.toBuffer(),
      ],
      PROGRAM_ID,
    );

  console.log("");
  console.log(
    "CrossChainConfig:",
    crossChainConfig.toBase58(),
  );

  console.log(
    "ConsumedVaa:",
    consumedVaa.toBase58(),
  );

  console.log(
    "CrossChainStream:",
    crossChainStream.toBase58(),
  );

  console.log(
    "Vault:",
    vault.toBase58(),
  );

  console.log(
    "Vault authority:",
    vaultAuthority.toBase58(),
  );

  console.log(
    "Native Stream:",
    stream.toBase58(),
  );

  console.log(
    "Stream escrow:",
    streamEscrow.toBase58(),
  );

  const consumedInfo =
    await connection.getAccountInfo(
      consumedVaa,
    );

  if (!consumedInfo) {
    throw new Error(
      "ConsumedVaa account does not exist. Run consume-vaa.ts first.",
    );
  }

  const crossChainStreamInfo =
    await connection.getAccountInfo(
      crossChainStream,
    );

  if (!crossChainStreamInfo) {
    throw new Error(
      "CrossChainStream account does not exist.",
    );
  }

  const streamInfo =
    await connection.getAccountInfo(
      stream,
    );

  if (!streamInfo) {
    throw new Error(
      "Native Stream account does not exist.",
    );
  }

  const escrowInfo =
    await connection.getAccountInfo(
      streamEscrow,
    );

  if (!escrowInfo) {
    throw new Error(
      "Stream escrow account does not exist.",
    );
  }

  const instructionData =
    Buffer.concat([
      discriminator(
        "execute_cross_chain_top_up",
      ),

      sequenceLe,

      nativeStreamIdLe,

      (() => {
        const length =
          Buffer.alloc(4);

        length.writeUInt32LE(
          vaaBody.length,
          0,
        );

        return length;
      })(),

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
          pubkey: crossChainStream,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: ORGANIZATION,
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
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],

      data: instructionData,
    });

  const computeBudget =
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 420_000,
    });

  const transaction =
    new Transaction()
      .add(computeBudget)
      .add(instruction);

  console.log("");
  console.log(
    "Simulating execute_cross_chain_top_up...",
  );

  const simulation =
    await connection.simulateTransaction(
      transaction,
      [payer],
    );

  console.log(
    "Simulation error:",
    simulation.value.err,
  );

  console.log(
    "Simulation logs:",
    simulation.value.logs,
  );

  if (
    simulation.value.err
  ) {
    throw new Error(
      "Simulation failed. Transaction was not sent.",
    );
  }

  console.log("");
  console.log(
    "Sending execute_cross_chain_top_up...",
  );

  const signature =
    await connection.sendTransaction(
      transaction,
      [payer],
    );

  await connection.confirmTransaction(
    signature,
    "confirmed",
  );

  console.log("");
  console.log(
    "======================================",
  );
  console.log(
    "CROSS-CHAIN TOP-UP EXECUTED",
  );
  console.log(
    "======================================",
  );
  console.log(
    "Sequence:",
    sequence.toString(),
  );
  console.log(
    "Native stream ID:",
    NATIVE_STREAM_ID.toString(),
  );
  console.log(
    "Employee:",
    employee.toBase58(),
  );
  console.log(
    "Top-up transaction:",
    signature,
  );
  console.log(
    "======================================",
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "execute_cross_chain_top_up failed:",
    );
    console.error(error);

    if (
      error?.logs
    ) {
      console.error(
        "Logs:",
        error.logs,
      );
    }

    process.exit(1);
  },
);
