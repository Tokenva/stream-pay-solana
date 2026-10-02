"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getStreamEscrowPda,
  getStreamPda,
  getVaultAuthorityPda,
  getVaultPda,
  SPL_TOKEN_PROGRAM_ID,
} from "@/lib/pdas";

type StreamData = {
  organization: PublicKey;
  employee: PublicKey;
  vault: PublicKey;
  escrow: PublicKey;
  mint: PublicKey;
  streamId: BN;
  totalAmount: BN;
  startTime: BN;
  endTime: BN;
  claimedAmount: BN;
  canceled: boolean;
  cancelTime: BN;
  bump: number;
};

export function useStream(
  mintAddress: string,
  streamId: number,
) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [stream, setStream] =
    useState<PublicKey | null>(null);

  const [streamEscrow, setStreamEscrow] =
    useState<PublicKey | null>(null);
  const ZERO = BigInt(0);
  const [data, setData] =
    useState<StreamData | null>(null);

  const [claimable, setClaimable] =
    useState<bigint>(ZERO);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadStream = useCallback(async () => {
    if (
      !wallet ||
      !mintAddress.trim()
    ) {
      setStream(null);
      setStreamEscrow(null);
      setData(null);
      setClaimable(ZERO);
      return;
    }

    try {
      setError(null);

      const mint = new PublicKey(mintAddress);

      const [organization] =
        getOrganizationPda(
          wallet.publicKey,
        );

      const [streamPda] =
        getStreamPda(
          organization,
          wallet.publicKey,
          streamId,
        );

      const [escrowPda] =
        getStreamEscrowPda(streamPda);

      setStream(streamPda);
      setStreamEscrow(escrowPda);

      const program = getProgram(
        connection,
        wallet,
      );

      const account =
        await program.account.stream.fetch(
          streamPda,
        ) as StreamData;

      setData(account);

      const now =
        BigInt(
          Math.floor(
            Date.now() / 1000,
          ),
        );

      const start =
        BigInt(account.startTime.toString());

      const end =
        BigInt(account.endTime.toString());

      const total =
        BigInt(account.totalAmount.toString());

      const claimed =
        BigInt(account.claimedAmount.toString());

      let earned = ZERO;

      if (now > start) {
        const effectiveEnd =
          account.canceled
            ? BigInt(
              account.cancelTime.toString(),
            ) < end
              ? BigInt(
                account.cancelTime.toString(),
              )
              : end
            : end;

        if (now >= effectiveEnd) {
          const elapsed =
            effectiveEnd > start
              ? effectiveEnd - start
              : ZERO;

          const duration =
            end - start;

          earned =
            duration > ZERO
              ? (total * elapsed) /
              duration
              : ZERO;
        } else {
          const elapsed =
            now - start;

          const duration =
            end - start;

          earned =
            duration > ZERO
              ? (total * elapsed) /
              duration
              : ZERO;
        }
      }

      const available =
        earned > claimed
          ? earned - claimed
          : ZERO;

      setClaimable(available);
    } catch (err) {
      setData(null);
      setClaimable(ZERO);

      const message =
        err instanceof Error
          ? err.message
          : "Stream not found";

      setError(message);
    }
  }, [
    connection,
    wallet,
    mintAddress,
    streamId,
  ]);

  useEffect(() => {
    void loadStream();

    const timer =
      window.setInterval(
        () => {
          void loadStream();
        },
        1000,
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [loadStream]);

  const createStream = useCallback(
    async (
      employeeAddress: string,
      amount: string,
      startTime: number,
      endTime: number,
    ) => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const employee =
        new PublicKey(employeeAddress);

      const mint =
        new PublicKey(mintAddress);

      const [organization] =
        getOrganizationPda(
          wallet.publicKey,
        );

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

      const [streamPda] =
        getStreamPda(
          organization,
          employee,
          streamId,
        );

      const [escrowPda] =
        getStreamEscrowPda(streamPda);

      const amountRaw =
        new BN(amount);

      if (amountRaw.lte(new BN(0))) {
        throw new Error(
          "Amount must be greater than zero",
        );
      }

      if (endTime <= startTime) {
        throw new Error(
          "End time must be after start time",
        );
      }

      const program =
        getProgram(
          connection,
          wallet,
        );

      setLoading(true);
      setError(null);

      try {
        const signature =
          await program.methods
            .createStream(
              new BN(streamId),
              amountRaw,
              new BN(startTime),
              new BN(endTime),
            )
            .accountsPartial({
              authority: wallet.publicKey,
              organization,
              employee,
              mint,
              vault,
              vaultAuthority,
              stream: streamPda,
              streamEscrow: escrowPda,
              tokenProgram:
                SPL_TOKEN_PROGRAM_ID,
            })
            .rpc();

        await loadStream();

        return {
          signature,
          stream: streamPda,
          escrow: escrowPda,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Create Stream failed";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      mintAddress,
      streamId,
      loadStream,
    ],
  );

  const claim = useCallback(
    async () => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      if (!stream || !streamEscrow || !data) {
        throw new Error(
          "Stream not loaded",
        );
      }

      const mint =
        new PublicKey(mintAddress);

      const tokenAccounts =
        await connection.getTokenAccountsByOwner(
          wallet.publicKey,
          { mint },
        );

      if (
        tokenAccounts.value.length === 0
      ) {
        throw new Error(
          "Employee token account not found",
        );
      }

      const employeeTokenAccount =
        tokenAccounts.value[0].pubkey;

      const program =
        getProgram(
          connection,
          wallet,
        );

      setLoading(true);
      setError(null);

      try {
        const signature =
          await program.methods
            .claim()
            .accountsPartial({
              employee:
                wallet.publicKey,
              stream,
              streamEscrow,
              mint,
              employeeTokenAccount,
              tokenProgram:
                SPL_TOKEN_PROGRAM_ID,
            })
            .rpc();

        await loadStream();

        return signature;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Claim failed";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      mintAddress,
      stream,
      streamEscrow,
      data,
      loadStream,
    ],
  );

  return {
    stream,
    streamEscrow,
    data,
    claimable,
    loading,
    error,
    refresh: loadStream,
    createStream,
    claim,
  };
}
