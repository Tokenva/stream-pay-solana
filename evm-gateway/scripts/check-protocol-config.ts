import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

const RPC_URL = "https://api.devnet.solana.com";

const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

const PROTOCOL_CONFIG_SEED = Buffer.from("protocol");

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  const [protocolConfig, bump] =
    PublicKey.findProgramAddressSync(
      [PROTOCOL_CONFIG_SEED],
      PROGRAM_ID,
    );

  const account = await connection.getAccountInfo(protocolConfig);

  console.log("ProtocolConfig PDA:", protocolConfig.toBase58());
  console.log("Bump:", bump);

  if (!account) {
    console.log("Status: NOT INITIALIZED");
    return;
  }

  console.log("Status: INITIALIZED");
  console.log("Owner:", account.owner.toBase58());
  console.log("Data size:", account.data.length);
}

main().catch(console.error);
