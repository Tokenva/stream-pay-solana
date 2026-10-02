"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import { getOrganizationPda } from "@/lib/pdas";

export function useOrganization() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [organization, setOrganization] =
    useState<ReturnType<typeof getOrganizationPda>[0] | null>(null);

  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!wallet) {
      setOrganization(null);
      setExists(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [organizationPda] =
        getOrganizationPda(wallet.publicKey);

      const account =
        await connection.getAccountInfo(
          organizationPda,
        );

      setOrganization(organizationPda);
      setExists(account !== null);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to read Organization",
      );
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    void loadOrganization();
  }, [loadOrganization]);

  const createOrganization = useCallback(
    async () => {
      if (!wallet) {
        throw new Error("Connect your wallet first");
      }

      const program = getProgram(
        connection,
        wallet,
      );

      const [organizationPda] =
        getOrganizationPda(wallet.publicKey);

      const signature =
        await program.methods
          .createOrganization()
          .accounts({
            authority: wallet.publicKey,
          })
          .rpc();

      await loadOrganization();

      return {
        signature,
        organizationPda,
      };
    },
    [connection, wallet, loadOrganization],
  );

  return {
    organization,
    exists,
    loading,
    error,
    refresh: loadOrganization,
    createOrganization,
  };
}
