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

const PROTOCOL_CONFIG_SEED = Buffer.from("protocol");

const WALLET_PATH = `${process.env.HOME}/.config/solana/id.json`;

function instructionDiscriminator(name: string): Buffer {
  return createHash("sha256")
    .update(`global:${name}`)
    .digest()
    .subarray(0, 8);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")),
  );

  const wallet = Keypair.fromSecretKey(secretKey);

  const [protocolConfig, bump] =
    PublicKey.findProgramAddressSync(
      [PROTOCOL_CONFIG_SEED],
      PROGRAM_ID,
    );

  console.log("Authority:", wallet.publicKey.toBase58());
  console.log("ProtocolConfig PDA:", protocolConfig.toBase58());
  console.log("Bump:", bump);

  const existing = await connection.getAccountInfo(protocolConfig);

  if (existing) {
    console.log("\nProtocolConfig already exists.");
    console.log("Owner:", existing.owner.toBase58());
    console.log("Data size:", existing.data.length);
    return;
  }

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: protocolConfig,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: instructionDiscriminator("initialize_protocol"),
  });

  const tx = new Transaction().add(instruction);

  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [wallet],
    {
      commitment: "confirmed",
    },
  );

  console.log("\n======================================");
  console.log("PROTOCOL INITIALIZED");
  console.log("======================================");
  console.log("PDA:", protocolConfig.toBase58());
  console.log("Transaction:", signature);
  console.log("======================================");
}

main().catch((error) => {
  console.error("\nInitialization failed:");
  console.error(error);
  process.exit(1);
});
