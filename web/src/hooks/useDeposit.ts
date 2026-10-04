"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getOrganizationRolesPda,
  getVaultPda,
  SPL_TOKEN_PROGRAM_ID,
} from "@/lib/pdas";

function toBaseUnits(value: string, decimals: number): BN {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid token amount");
  }

  const [whole, fraction = ""] = normalized.split(".");

  if (fraction.length > decimals) {
    throw new Error(`Token supports ${decimals} decimal places`);
  }

  const paddedFraction = fraction
    .padEnd(decimals, "0");

  const base = new BN(10).pow(new BN(decimals));

  return new BN(whole)
    .mul(base)
    .add(new BN(paddedFraction || "0"));
}

export function useDeposit(mintAddress: string, onDeposited?: () => Promise<void>) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [tokenAccount, setTokenAccount] =
    useState<PublicKey | null>(null);

  const [tokenBalance, setTokenBalance] =
    useState<string | null>(null);

  const [decimals, setDecimals] = useState(6);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadTokenAccount = useCallback(async () => {
    if (!wallet || !mintAddress.trim()) {
      setTokenAccount(null);
      setTokenBalance(null);
      return;
    }

    try {
      setError(null);

      const mint = new PublicKey(mintAddress);

      const supply =
        await connection.getTokenSupply(mint);

      setDecimals(supply.value.decimals);

      const accounts =
        await connection.getTokenAccountsByOwner(
          wallet.publicKey,
          { mint },
        );

      if (accounts.value.length === 0) {
        setTokenAccount(null);
        setTokenBalance("0");
        return;
      }

      const account = accounts.value[0].pubkey;

      setTokenAccount(account);

      const balance =
        await connection.getTokenAccountBalance(
          account,
        );

      setTokenBalance(
        balance.value.uiAmountString ?? "0",
      );
    } catch (err) {
      setTokenAccount(null);
      setTokenBalance(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to read token account",
      );
    }
  }, [connection, wallet, mintAddress]);

  useEffect(() => {
    void loadTokenAccount();
  }, [loadTokenAccount]);

  const deposit = useCallback(
    async (amount: string) => {
      if (!wallet) {
        throw new Error("Connect your wallet first");
      }

      if (!tokenAccount) {
        throw new Error("No token account found for this mint");
      }

      const mint = new PublicKey(mintAddress);

      const [organization] =
        getOrganizationPda(wallet.publicKey);

      const [roles] =
        getOrganizationRolesPda(
          organization,
        );

      const [vault] =
        getVaultPda(organization, mint);

      const rawAmount =
        toBaseUnits(amount, decimals);

      if (rawAmount.isZero()) {
        throw new Error("Deposit amount must be greater than zero");
      }

      const program = getProgram(
        connection,
        wallet,
      );

      setLoading(true);
      setError(null);

      try {
        const signature =
          await program.methods
            .deposit(rawAmount)
            .accountsPartial({
              depositor: wallet.publicKey,
              organization,
              roles,
              depositorTokenAccount: tokenAccount,
              mint,
              vault,
              tokenProgram: SPL_TOKEN_PROGRAM_ID,
            })
            .rpc();

        await loadTokenAccount();

        if (onDeposited) {
          await onDeposited();
        }

        return signature;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Deposit failed";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      tokenAccount,
      mintAddress,
      decimals,
      loadTokenAccount,
      onDeposited,
    ],
  );

  return {
    tokenAccount,
    tokenBalance,
    decimals,
    loading,
    error,
    refresh: loadTokenAccount,
    deposit,
  };
}
