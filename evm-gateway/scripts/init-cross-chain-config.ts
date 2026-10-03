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

const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

const WALLET_PATH = `${process.env.HOME}/.config/solana/id.json`;

const PROTOCOL_CONFIG_SEED = Buffer.from("protocol");
const CROSS_CHAIN_CONFIG_SEED = Buffer.from("cross-chain");

// Sepolia StreamPay gateway emitter
const SOURCE_EMITTER = Buffer.from(
  "00000000000000000000000013a5b0be7f5841ac2cb0d07e71bb4209f469f104",
  "hex",
);

function instructionDiscriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

async function main() {
  console.log("Initializing StreamPay cross-chain config...");

  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")),
  );

  const wallet = Keypair.fromSecretKey(secretKey);

  const connection = new Connection(RPC_URL, "confirmed");

  console.log("Authority:", wallet.publicKey.toBase58());
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Source emitter:", SOURCE_EMITTER.toString("hex"));

  // --------------------------------------------------
  // ProtocolConfig PDA
  // --------------------------------------------------

  const [protocolConfig, protocolBump] =
    PublicKey.findProgramAddressSync(
      [PROTOCOL_CONFIG_SEED],
      PROGRAM_ID,
    );

  // --------------------------------------------------
  // CrossChainConfig PDA
  // --------------------------------------------------

  const [crossChainConfig, crossChainBump] =
    PublicKey.findProgramAddressSync(
      [CROSS_CHAIN_CONFIG_SEED],
      PROGRAM_ID,
    );

  console.log("ProtocolConfig PDA:", protocolConfig.toBase58());
  console.log("Protocol bump:", protocolBump);

  console.log("CrossChainConfig PDA:", crossChainConfig.toBase58());
  console.log("Cross-chain bump:", crossChainBump);

  // --------------------------------------------------
  // Check existing config
  // --------------------------------------------------

  const existing = await connection.getAccountInfo(
    crossChainConfig,
  );

  if (existing) {
    console.log("\nCrossChainConfig already exists.");
    console.log("Owner:", existing.owner.toBase58());
    console.log("Data size:", existing.data.length);
    return;
  }

  // --------------------------------------------------
  // initialize_cross_chain_config(source_emitter)
  // --------------------------------------------------

  const data = Buffer.concat([
    instructionDiscriminator(
      "initialize_cross_chain_config",
    ),
    SOURCE_EMITTER,
  ]);

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      // authority
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true,
      },

      // protocol_config
      {
        pubkey: protocolConfig,
        isSigner: false,
        isWritable: false,
      },

      // cross_chain_config
      {
        pubkey: crossChainConfig,
        isSigner: false,
        isWritable: true,
      },

      // system_program
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });

  const transaction = new Transaction().add(
    instruction,
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet],
    {
      commitment: "confirmed",
    },
  );

  console.log("\n======================================");
  console.log("CROSS-CHAIN CONFIG INITIALIZED");
  console.log("======================================");
  console.log("ProtocolConfig:", protocolConfig.toBase58());
  console.log("CrossChainConfig:", crossChainConfig.toBase58());
  console.log("Source chain: Sepolia");
  console.log("Source emitter:", SOURCE_EMITTER.toString("hex"));
  console.log("Transaction:", signature);
  console.log("======================================");
}

main().catch((error) => {
  console.error("\nInitialization failed:");
  console.error(error);

  if (error?.transactionLogs) {
    console.error("\nTransaction logs:");
    console.error(error.transactionLogs);
  }

  process.exit(1);
});