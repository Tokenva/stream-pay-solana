"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getVaultAuthorityPda,
  getVaultPda,
} from "@/lib/pdas";

export function useVault(mintAddress: string, companyOwnerAddress = "") {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [vault, setVault] = useState<PublicKey | null>(null);
  const [vaultAuthority, setVaultAuthority] =
    useState<PublicKey | null>(null);

  const [exists, setExists] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVault = useCallback(async () => {
    if (!wallet || !mintAddress.trim()) {
      setVault(null);
      setVaultAuthority(null);
      setExists(false);
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mint = new PublicKey(mintAddress);

      const owner =
        new PublicKey(
          companyOwnerAddress.trim() ||
            wallet.publicKey.toBase58(),
        );

      const [organizationPda] =
        getOrganizationPda(owner);

      const [vaultPda] = getVaultPda(
        organizationPda,
        mint,
      );

      const [vaultAuthorityPda] =
        getVaultAuthorityPda(
          organizationPda,
          mint,
        );

      setVault(vaultPda);
      setVaultAuthority(vaultAuthorityPda);

      const account =
        await connection.getAccountInfo(vaultPda);

      setExists(account !== null);

      if (account) {
        try {
          const tokenBalance =
            await connection.getTokenAccountBalance(
              vaultPda,
            );

          setBalance(
            tokenBalance.value.uiAmountString ?? "0",
          );
        } catch {
          setBalance("0");
        }
      } else {
        setBalance(null);
      }
    } catch (err) {
      setVault(null);
      setVaultAuthority(null);
      setExists(false);
      setBalance(null);

      setError(
        err instanceof Error
          ? err.message
          : "Invalid mint address",
      );
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, mintAddress, companyOwnerAddress]);

  useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const createVault = useCallback(async () => {
    if (!wallet) {
      throw new Error("Connect your wallet first");
    }

    if (!mintAddress.trim()) {
      throw new Error("Enter a token mint");
    }

    const mint = new PublicKey(mintAddress);

    const [organizationPda] =
      getOrganizationPda(wallet.publicKey);

    const [vaultPda] = getVaultPda(
      organizationPda,
      mint,
    );

    const [vaultAuthorityPda] =
      getVaultAuthorityPda(
        organizationPda,
        mint,
      );

    const program = getProgram(
      connection,
      wallet,
    );

    const signature =
      await program.methods
        .initializeVault()
        .accountsPartial({
          authority: wallet.publicKey,
          organization: organizationPda,
          mint,
          vault: vaultPda,
          vaultAuthority: vaultAuthorityPda,
        })
        .rpc();

    await loadVault();

    return {
      signature,
      vaultPda,
      vaultAuthorityPda,
    };
  }, [
    connection,
    wallet,
    mintAddress,
    loadVault,
  ]);

  return {
    vault,
    vaultAuthority,
    exists,
    balance,
    loading,
    error,
    refresh: loadVault,
    createVault,
  };
}
