import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs";
import { createHash } from "crypto";

const RPC_URL = "https://api.devnet.solana.com";

const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJZmdYq3jDUQYAZ6TXXjZDskS",
);

const MINT = new PublicKey(
  "6jDvPYSs5qerGyXe3G2FLpFJhFQHHvjbkj9Xi9jYDxhB",
);

const CROSS_CHAIN_ASSET_CONFIG_SEED = Buffer.from(
  "cross-chain-asset",
);

const PROTOCOL_CONFIG_SEED = Buffer.from(
  "protocol",
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
      JSON.parse(
        fs.readFileSync(path, "utf8"),
      ),
    ),
  );
}

async function main() {
  const connection = new Connection(
    RPC_URL,
    "confirmed",
  );

  const authority = loadKeypair(
    `${process.env.HOME}/.config/solana/id.json`,
  );

  const protocolConfig = new PublicKey(
    "62hSrssQue2ed1n9dxviZtNcNcSpB8QdQBX6zP66GTwA",
  );

  const crossChainAssetConfig = new PublicKey(
    "jhPuSJ7NK7vGMKE4RMwhBrJvxL4qXNQ1H8zvJSbYrJ9",
  );

  const bump = 255;

  console.log("Authority:", authority.publicKey.toBase58());
  console.log("ProtocolConfig:", protocolConfig.toBase58());
  console.log(
    "CrossChainAssetConfig:",
    crossChainAssetConfig.toBase58(),
  );
  console.log("Mint:", MINT.toBase58());
  console.log("Bump:", bump);

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
          pubkey: protocolConfig,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: crossChainAssetConfig,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: MINT,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: discriminator(
        "initialize_cross_chain_asset_config",
      ),
    });

  const tx = new Transaction().add(
    instruction,
  );

  const signature =
    await sendAndConfirmTransaction(
      connection,
      tx,
      [authority],
    );

  console.log("");
  console.log(
    "Cross-chain asset config initialized",
  );
  console.log("Tx:", signature);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
