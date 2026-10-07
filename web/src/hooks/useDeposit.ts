"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import BN from "bn.js";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getOrganizationRolesPda,
  getOrganizationPolicyPda,
  getVaultPda,
  SPL_TOKEN_PROGRAM_ID,
} from "@/lib/pdas";

const ASSOCIATED_TOKEN_PROGRAM_ID =
  new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  );

function toBaseUnits(
  value: string,
  decimals: number,
): BN {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid token amount");
  }

  const [whole, fraction = ""] =
    normalized.split(".");

  if (fraction.length > decimals) {
    throw new Error(
      `Token supports ${decimals} decimal places`,
    );
  }

  const paddedFraction =
    fraction.padEnd(decimals, "0");

  const base = new BN(10).pow(
    new BN(decimals),
  );

  return new BN(whole)
    .mul(base)
    .add(
      new BN(
        paddedFraction || "0",
      ),
    );
}

export function useDeposit(
  mintAddress: string,
  onDeposited?: () => Promise<void>,
  companyOwnerAddress = "",
) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [tokenAccount, setTokenAccount] =
    useState<PublicKey | null>(null);

  const [tokenBalance, setTokenBalance] =
    useState<string | null>(null);

  const [decimals, setDecimals] =
    useState(6);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadTokenAccount =
    useCallback(async () => {
      if (
        !wallet ||
        !mintAddress.trim()
      ) {
        setTokenAccount(null);
        setTokenBalance(null);
        return;
      }

      try {
        setError(null);

        const mint =
          new PublicKey(mintAddress);

        const supply =
          await connection.getTokenSupply(
            mint,
          );

        setDecimals(
          supply.value.decimals,
        );

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

        const account =
          accounts.value[0].pubkey;

        setTokenAccount(account);

        const balance =
          await connection.getTokenAccountBalance(
            account,
          );

        setTokenBalance(
          balance.value
            .uiAmountString ?? "0",
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
    }, [
      connection,
      wallet,
      mintAddress,
    ]);

  useEffect(() => {
    void loadTokenAccount();
  }, [loadTokenAccount]);

  const createAssociatedTokenAccount =
    useCallback(
      async (
        mint: PublicKey,
      ): Promise<PublicKey> => {
        if (!wallet) {
          throw new Error(
            "Connect your wallet first",
          );
        }

        const [
          associatedTokenAccount,
        ] =
          PublicKey.findProgramAddressSync(
            [
              wallet.publicKey.toBuffer(),
              SPL_TOKEN_PROGRAM_ID.toBuffer(),
              mint.toBuffer(),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID,
          );

        const existingAccount =
          await connection.getAccountInfo(
            associatedTokenAccount,
          );

        if (existingAccount) {
          return associatedTokenAccount;
        }

        const instruction =
          new TransactionInstruction({
            programId:
              ASSOCIATED_TOKEN_PROGRAM_ID,

            keys: [
              {
                pubkey:
                  wallet.publicKey,
                isSigner: true,
                isWritable: true,
              },
              {
                pubkey:
                  associatedTokenAccount,
                isSigner: false,
                isWritable: true,
              },
              {
                pubkey:
                  wallet.publicKey,
                isSigner: false,
                isWritable: false,
              },
              {
                pubkey: mint,
                isSigner: false,
                isWritable: false,
              },
              {
                pubkey:
                  SystemProgram.programId,
                isSigner: false,
                isWritable: false,
              },
              {
                pubkey:
                  SPL_TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
              },
            ],

            // CreateIdempotent instruction.
            data: Buffer.from([1]),
          });

        const transaction =
          new Transaction().add(
            instruction,
          );

        const latestBlockhash =
          await connection.getLatestBlockhash();

        transaction.recentBlockhash =
          latestBlockhash.blockhash;

        transaction.feePayer =
          wallet.publicKey;

        const signedTransaction =
          await wallet.signTransaction(
            transaction,
          );

        const signature =
          await connection.sendRawTransaction(
            signedTransaction.serialize(),
          );

        await connection.confirmTransaction({
          signature,
          blockhash:
            latestBlockhash.blockhash,
          lastValidBlockHeight:
            latestBlockhash.lastValidBlockHeight,
        });

        return associatedTokenAccount;
      },
      [connection, wallet],
    );

  const deposit = useCallback(
    async (amount: string) => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      if (!mintAddress.trim()) {
        throw new Error(
          "Token mint is not configured",
        );
      }

      const mint =
        new PublicKey(mintAddress);

      setLoading(true);
      setError(null);

      try {
        let depositorTokenAccount =
          tokenAccount;

        /*
         * If the wallet does not currently have
         * an SPL token account for this mint,
         * create its associated token account
         * only when the user actually deposits.
         */
        if (!depositorTokenAccount) {
          depositorTokenAccount =
            await createAssociatedTokenAccount(
              mint,
            );

          setTokenAccount(
            depositorTokenAccount,
          );

          setTokenBalance("0");
        }

        const owner =
          new PublicKey(
            companyOwnerAddress.trim() ||
            wallet.publicKey.toBase58(),
          );

        const [organization] =
          getOrganizationPda(owner);

        const [roles] =
          getOrganizationRolesPda(
            organization,
          );

        const [policy] =
          getOrganizationPolicyPda(
            organization,
          );

        const [vault] =
          getVaultPda(
            organization,
            mint,
          );

        const rawAmount =
          toBaseUnits(
            amount,
            decimals,
          );

        if (rawAmount.isZero()) {
          throw new Error(
            "Deposit amount must be greater than zero",
          );
        }

        const rolesAccount =
          await connection.getAccountInfo(
            roles,
          );

        const policyAccount =
          await connection.getAccountInfo(
            policy,
          );

        const program =
          getProgram(
            connection,
            wallet,
          );

        const signature =
          await program.methods
            .deposit(rawAmount)
            .accountsPartial({
              depositor:
                wallet.publicKey,
              organization,
              depositorTokenAccount:
                depositorTokenAccount,
              mint,
              vault,
              tokenProgram:
                SPL_TOKEN_PROGRAM_ID,
              ...(rolesAccount
                ? { roles }
                : {}),
              ...(policyAccount
                ? { policy }
                : {}),
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
      companyOwnerAddress,
      createAssociatedTokenAccount,
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