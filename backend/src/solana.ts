import "dotenv/config";

import { Program } from "@anchor-lang/core";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

import idl from "../../target/idl/stream_pay_solana.json" with {
  type: "json",
};

import type { StreamPaySolana } from "../../target/types/stream_pay_solana.js";

const rpcUrl =
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

export const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

export const connection = new Connection(
  rpcUrl,
  "confirmed",
);

export const program =
  new Program<StreamPaySolana>(
    idl as StreamPaySolana,
    {
      connection,
    },
  );
