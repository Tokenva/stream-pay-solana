import "dotenv/config";

import { Program } from "@anchor-lang/core";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

import idl from "./idl/stream_pay_solana.json" with {
  type: "json",
};

import type { StreamPaySolana } from "../../web/src/idl/stream_pay_solana.ts";
import { log } from "./logger.js";

const rpcUrls = (
  process.env.SOLANA_RPC_URLS ??
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (rpcUrls.length === 0) {
  throw new Error("No Solana RPC URLs configured.");
}

export const PROGRAM_ID = new PublicKey(
  "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
);

export const rpcConnections = rpcUrls.map(
  (url) => new Connection(url, "confirmed"),
);

export const connection = rpcConnections[0];

export async function withRpcFailover<T>(
  operation: (rpcConnection: Connection) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let index = 0; index < rpcConnections.length; index++) {
    const rpcConnection = rpcConnections[index];

    try {
      return await operation(rpcConnection);
    } catch (error) {
      lastError = error;

      log("warn", "rpc_endpoint_failed", {
        endpointIndex: index + 1,
        endpointCount: rpcConnections.length,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      if (index < rpcConnections.length - 1) {
        log("info", "rpc_failover", {
          fromEndpoint: index + 1,
          toEndpoint: index + 2,
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Solana RPC endpoints failed.");
}

export function getProgramForConnection(
  rpcConnection: Connection,
): Program<StreamPaySolana> {
  return new Program<StreamPaySolana>(
    idl as StreamPaySolana,
    {
      connection: rpcConnection,
    },
  );
}

export async function withProgramFailover<T>(
  operation: (
    rpcProgram: Program<StreamPaySolana>,
  ) => Promise<T>,
): Promise<T> {
  return withRpcFailover((rpcConnection) =>
    operation(getProgramForConnection(rpcConnection)),
  );
}

export const program = getProgramForConnection(connection);

