"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PublicKey } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import { getOrganizationPda } from "@/lib/pdas";

export function useOrganization() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const walletKey =
    wallet?.publicKey.toBase58() ?? null;

  const [organization, setOrganization] =
    useState<PublicKey | null>(null);

  const [exists, setExists] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadedWalletRef =
    useRef<string | null>(null);

  const loadingRef =
    useRef(false);

  const loadOrganization = useCallback(
    async (force = false) => {
      if (!walletKey) {
        loadedWalletRef.current = null;
        setOrganization(null);
        setExists(false);
        setError(null);
        return;
      }

      if (
        !force &&
        loadedWalletRef.current === walletKey
      ) {
        return;
      }

      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const walletPublicKey =
          new PublicKey(walletKey);

        const [organizationPda] =
          getOrganizationPda(
            walletPublicKey,
          );

        const account =
          await connection.getAccountInfo(
            organizationPda,
          );

        setOrganization(organizationPda);
        setExists(account !== null);

        loadedWalletRef.current = walletKey;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to read Organization",
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [connection, walletKey],
  );

  useEffect(() => {
    void loadOrganization(true);
  }, [loadOrganization, walletKey]);

  const createOrganization = useCallback(
    async () => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const program = getProgram(
        connection,
        wallet,
      );

      const [organizationPda] =
        getOrganizationPda(
          wallet.publicKey,
        );

      const signature =
        await program.methods
          .createOrganization()
          .accounts({
            authority: wallet.publicKey,
          })
          .rpc();

      await loadOrganization(true);

      return {
        signature,
        organizationPda,
      };
    },
    [
      connection,
      wallet,
      loadOrganization,
    ],
  );

  return {
    organization,
    exists,
    loading,
    error,
    refresh: () =>
      loadOrganization(true),
    createOrganization,
  };
}