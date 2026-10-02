"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getStreamEscrowPda,
  getStreamPda,
  getVaultAuthorityPda,
  getVaultPda,
  SPL_TOKEN_PROGRAM_ID,
} from "@/lib/pdas";

export function useStreamActions(
  mintAddress: string,
  streamId: number,
  employeeAddress: string,
  onComplete?: () => Promise<void>,
) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const resolveAccounts = useCallback(() => {
    if (!wallet) {
      throw new Error("Connect your wallet first");
    }

    const mint = new PublicKey(mintAddress);
    const employee = new PublicKey(employeeAddress);

    const [organization] =
      getOrganizationPda(wallet.publicKey);

    const [vault] =
      getVaultPda(
        organization,
        mint,
      );

    const [vaultAuthority] =
      getVaultAuthorityPda(
        organization,
        mint,
      );

    const [stream] =
      getStreamPda(
        organization,
        employee,
        streamId,
      );

    const [streamEscrow] =
      getStreamEscrowPda(stream);

    return {
      mint,
      employee,
      organization,
      vault,
      vaultAuthority,
      stream,
      streamEscrow,
    };
  }, [
    wallet,
    mintAddress,
    employeeAddress,
    streamId,
  ]);

  const topUp = useCallback(
    async (amount: string) => {
      const accounts = resolveAccounts();

      const rawAmount =
        new BN(amount);

      if (rawAmount.lte(new BN(0))) {
        throw new Error(
          "Top-up amount must be greater than zero",
        );
      }

      const program =
        getProgram(
          connection,
          wallet!,
        );

      setLoading(true);
      setError(null);

      try {
        const signature =
          await program.methods
            .topUpStream(
              new BN(streamId),
              rawAmount,
            )
            .accountsPartial({
              authority:
                wallet!.publicKey,
              organization:
                accounts.organization,
              employee:
                accounts.employee,
              stream:
                accounts.stream,
              vault:
                accounts.vault,
              vaultAuthority:
                accounts.vaultAuthority,
              streamEscrow:
                accounts.streamEscrow,
              mint:
                accounts.mint,
              tokenProgram:
                SPL_TOKEN_PROGRAM_ID,
            })
            .rpc();

        await onComplete?.();

        return signature;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Top-up failed";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      streamId,
      resolveAccounts,
      onComplete,
    ],
  );

  const cancel = useCallback(
    async () => {
      const accounts = resolveAccounts();

      const employeeTokenAccounts =
        await connection.getTokenAccountsByOwner(
          accounts.employee,
          {
            mint: accounts.mint,
          },
        );

      if (
        employeeTokenAccounts.value.length ===
        0
      ) {
        throw new Error(
          "Employee token account not found",
        );
      }

      const employeeTokenAccount =
        employeeTokenAccounts.value[0].pubkey;

      const program =
        getProgram(
          connection,
          wallet!,
        );

      setLoading(true);
      setError(null);

      try {
        const signature =
          await program.methods
            .cancelStream(
              new BN(streamId),
            )
            .accountsPartial({
              authority:
                wallet!.publicKey,
              organization:
                accounts.organization,
              employee:
                accounts.employee,
              stream:
                accounts.stream,
              streamEscrow:
                accounts.streamEscrow,
              vault:
                accounts.vault,
              vaultAuthority:
                accounts.vaultAuthority,
              mint:
                accounts.mint,
              employeeTokenAccount,
              tokenProgram:
                SPL_TOKEN_PROGRAM_ID,
            })
            .rpc();

        await onComplete?.();

        return signature;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Cancel failed";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      streamId,
      resolveAccounts,
      onComplete,
    ],
  );

  return {
    loading,
    error,
    topUp,
    cancel,
  };
}
