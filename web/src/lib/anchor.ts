import {
  AnchorProvider,
  Program,
} from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

import idl from "@/idl/stream_pay_solana.json";
import type { StreamPaySolana } from "@/idl/stream_pay_solana";

export const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

export function getProgram(
  connection: Connection,
  wallet: AnchorWallet,
) {
  const provider = new AnchorProvider(
    connection,
    wallet,
    {
      commitment: "confirmed",
    },
  );

  return new Program<StreamPaySolana>(
    idl,
    provider,
  );
}