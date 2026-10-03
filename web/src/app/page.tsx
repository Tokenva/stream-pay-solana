"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ActivityHistory from "@/components/ActivityHistory";
import WalletButton from "@/components/WalletButton";
import { useOrganization } from "@/hooks/useOrganization";
import { useVault } from "@/hooks/useVault";
import { useDeposit } from "@/hooks/useDeposit";
import { useStream } from "@/hooks/useStream";
import { useStreamActions } from "@/hooks/useStreamActions";
import { useIndexedStreams } from "@/hooks/useIndexedStreams";
import ActivityStats from "@/components/ActivityStats";
const MINT =
  process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";

const DECIMALS = 6;
const BASE_UNITS = BigInt(1_000_000);
const ZERO = BigInt(0);
function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function toBaseUnits(
  value: string,
) {
  const [whole, fraction = ""] =
    value.trim().split(".");

  if (!/^\d+$/.test(whole)) {
    throw new Error(
      "Invalid token amount",
    );
  }

  const padded =
    fraction
      .padEnd(DECIMALS, "0")
      .slice(0, DECIMALS);

  return (
    BigInt(whole) *
    BASE_UNITS +
    BigInt(padded || "0")
  ).toString();
}

function formatTokenAmount(
  raw: bigint,
) {
  const whole =
    raw / BASE_UNITS;

  const fraction =
    raw % BASE_UNITS;

  if (fraction === ZERO) {
    return whole.toString();
  }

  return `${whole}.${fraction
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "")}`;
}

export default function Home() {
  const { publicKey } = useWallet();

  const [depositAmount, setDepositAmount] =
    useState("");

  const [employeeAddress, setEmployeeAddress] =
    useState("");

  const [streamAmount, setStreamAmount] =
    useState("500");

  const [streamId, setStreamId] =
    useState(1);

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const now =
      Math.floor(
        Date.now() / 1000,
      );

    const start =
      new Date(
        (now - 3600) * 1000,
      );

    const end =
      new Date(
        (now + 23 * 3600) * 1000,
      );

    const formatDateTime = (
      date: Date,
    ) =>
      `${date
        .getFullYear()
        .toString()
        .padStart(4, "0")}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${date
            .getDate()
            .toString()
            .padStart(2, "0")}T${date
              .getHours()
              .toString()
              .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

    setStartTime(
      formatDateTime(start),
    );

    setEndTime(
      formatDateTime(end),
    );
  }, []);

  const {
    organization,
    exists: organizationExists,
  } = useOrganization();

  const {
    vault,
    exists: vaultExists,
    balance: vaultBalance,
    refresh: refreshVault,
  } = useVault(MINT);

  const {
    tokenAccount,
    tokenBalance,
    deposit,
    loading: depositLoading,
  } = useDeposit(
    MINT,
    refreshVault,
  );

  const {
    stream,
    streamEscrow,
    data: streamData,
    claimable,
    loading: streamLoading,
    error: streamError,
    createStream,
    claim,
  } = useStream(
    MINT,
    streamId,
  );

  const {
    loading: actionLoading,
    error: actionErrorStream,
    topUp,
    cancel,
  } = useStreamActions(
    MINT,
    streamId,
    employeeAddress,
    async () => {
      await refreshVault();
    },
  );

  const {
    streams: indexedStreams,
    loading: indexedStreamsLoading,
    error: indexedStreamsError,
    refresh: refreshIndexedStreams,
  } = useIndexedStreams(
    publicKey?.toBase58(),
  );

  useEffect(() => {
    if (
      publicKey &&
      !employeeAddress
    ) {
      setEmployeeAddress(
        publicKey.toBase58(),
      );
    }
  }, [
    publicKey,
    employeeAddress,
  ]);

  async function handleDeposit() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await deposit(
          depositAmount,
        );

      setDepositAmount("");

      setMessage(
        `Deposit successful: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Deposit failed",
      );
    }
  }

  async function handleTopUp() {
    try {
      setMessage(null);
      setActionError(null);;

      const rawAmount =
        toBaseUnits("100");

      const signature =
        await topUp(rawAmount);

      setMessage(
        `Stream topped up: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Top-up failed",
      );
    }
  }

  async function handleCancel() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await cancel();

      setMessage(
        `Stream canceled: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Top-up failed",
      );
    }
  }

  async function handleCreateStream() {

    try {
      setMessage(null);
      setActionError(null);

      if (!startTime || !endTime) {
        throw new Error("Choose stream start and end times");
      }

      const start = Math.floor(
        new Date(startTime).getTime() / 1000,
      );

      const end = Math.floor(
        new Date(endTime).getTime() / 1000,
      );

      const rawAmount = toBaseUnits(streamAmount);

      const result = await createStream(
        employeeAddress,
        rawAmount,
        start,
        end,
      );

      await refreshVault();

      setMessage(
        `Stream created: ${shortenAddress(
          result.stream.toBase58(),
        )}`,
      );
    } catch (err) {
      console.error("CREATE STREAM ERROR:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Create Stream failed",
      );
    }
  }

  async function handleClaim() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await claim();

      setMessage(
        `Claim successful: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Claim failed",
      );
    }
  }

  const earnedDisplay =
    formatTokenAmount(
      claimable,
    );

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Trustless Payroll Protocol
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              StreamPay
            </h1>
          </div>

          <WalletButton />
        </header>

        {message && (
          <div className="mt-8 rounded-xl border border-green-900 bg-green-950/40 p-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {actionError && (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {actionError}
          </div>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Wallet
            </p>

            <p className="mt-3 break-all">
              {publicKey
                ? shortenAddress(
                  publicKey.toBase58(),
                )
                : "Not connected"}
            </p>

            <p className="mt-6 text-sm text-zinc-400">
              Token Balance
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {tokenBalance ?? "0"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Organization
            </p>

            <p className="mt-3 break-all">
              {organization
                ? shortenAddress(
                  organization.toBase58(),
                )
                : "—"}
            </p>

            <p
              className={`mt-5 text-sm ${organizationExists
                ? "text-green-400"
                : "text-yellow-400"
                }`}
            >
              {organizationExists
                ? "Organization exists"
                : "Organization not found"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Vault
            </p>

            <p className="mt-3 break-all">
              {vault
                ? shortenAddress(
                  vault.toBase58(),
                )
                : "—"}
            </p>

            <p className="mt-5 text-sm text-zinc-400">
              Balance
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {vaultBalance ?? "0"}
            </p>

            <p
              className={`mt-4 text-sm ${vaultExists
                ? "text-green-400"
                : "text-yellow-400"
                }`}
            >
              {vaultExists
                ? "Vault exists"
                : "Vault not found"}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Token Mint
          </p>

          <p className="mt-2 break-all text-sm">
            {MINT}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Treasury Deposit
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Fund company payroll
          </h2>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row">
            <input
              value={depositAmount}
              onChange={(event) =>
                setDepositAmount(
                  event.target.value,
                )
              }
              placeholder="Amount"
              inputMode="decimal"
              className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none"
            />

            <button
              type="button"
              disabled={
                depositLoading ||
                !vaultExists ||
                !tokenAccount ||
                !depositAmount
              }
              onClick={handleDeposit}
              className="rounded-xl cursor-pointer bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
            >
              {depositLoading
                ? "Depositing..."
                : "Deposit"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div>
            <p className="text-sm text-zinc-400">
              Payment Stream
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Create payroll stream
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              value={employeeAddress}
              onChange={(event) =>
                setEmployeeAddress(
                  event.target.value,
                )
              }
              placeholder="Employee wallet address"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <input
              value={streamId}
              onChange={(event) =>
                setStreamId(
                  Number(event.target.value),
                )
              }
              type="number"
              min="1"
              placeholder="Stream ID"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <input
              value={streamAmount}
              onChange={(event) =>
                setStreamAmount(
                  event.target.value,
                )
              }
              inputMode="decimal"
              placeholder="Total amount"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            {mounted && (
              <>
                <input
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />

                <input
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />
              </>
            )}
          </div>

          <button
            type="button"
            disabled={
              streamLoading ||
              !vaultExists ||
              !employeeAddress ||
              !streamAmount
            }
            onClick={
              handleCreateStream
            }
            className="mt-5 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
          >
            {streamLoading
              ? "Creating..."
              : "Create Stream"}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Active Stream
          </p>

          {streamData ? (
            <>
              <div className="mt-5 grid gap-5 md:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500">
                    Stream
                  </p>

                  <p className="mt-2 break-all text-sm">
                    {stream
                      ? shortenAddress(
                        stream.toBase58(),
                      )
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Total
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {formatTokenAmount(
                      BigInt(
                        streamData.totalAmount.toString(),
                      ),
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Claimable
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {earnedDisplay}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      streamData.canceled
                    }
                    onClick={handleTopUp}
                    className="rounded-xl cursor-pointer border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Top Up 100"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      streamData.canceled
                    }
                    onClick={handleCancel}
                    className="rounded-xl cursor-pointer border border-red-900 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Cancel Stream"}
                  </button>
                </div>

                {actionErrorStream && (
                  <p className="mt-4 text-sm text-red-400">
                    {actionErrorStream}
                  </p>
                )}

                <div>
                  <p className="text-xs text-zinc-500">
                    Status
                  </p>

                  <p className="mt-2">
                    {streamData.canceled
                      ? "Canceled"
                      : "Active"}
                  </p>
                </div>
              </div>

              {streamEscrow && (
                <p className="mt-5 break-all text-xs text-zinc-500">
                  Escrow:{" "}
                  {shortenAddress(
                    streamEscrow.toBase58(),
                  )}
                </p>
              )}

              {streamError && (
                <p className="mt-4 text-sm text-red-400">
                  {streamError}
                </p>
              )}

              <button
                type="button"
                disabled={
                  streamLoading ||
                  claimable === ZERO ||
                  streamData.canceled
                }
                onClick={
                  handleClaim
                }
                className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
              >
                {streamLoading
                  ? "Processing..."
                  : claimable > ZERO
                    ? `Claim ${earnedDisplay}`
                    : "Nothing to claim yet"}
              </button>
            </>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              No Stream found for the current
              wallet and Stream ID.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Indexed Streams
              </h2>

              <p className="text-sm text-white/50">
                Data served by StreamPay backend
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refreshIndexedStreams()}
              className="rounded cursor-pointer lg border border-white/10 px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>

          {indexedStreamsLoading && (
            <p className="text-sm text-white/50">
              Loading indexed streams...
            </p>
          )}

          {indexedStreamsError && (
            <p className="text-sm text-red-400">
              {indexedStreamsError}
            </p>
          )}

          {!indexedStreamsLoading &&
            !indexedStreamsError &&
            indexedStreams.length === 0 && (
              <p className="text-sm text-white/50">
                No indexed streams found.
              </p>
            )}

          <div className="space-y-3">
            {indexedStreams.map((stream) => (
              <div
                key={stream.address}
                className="rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <span>
                    Stream #{stream.stream_id}
                  </span>

                  <span
                    className={
                      stream.canceled
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {stream.canceled
                      ? "Canceled"
                      : "Active"}
                  </span>
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {stream.address}
                </div>
              </div>
            ))}
          </div>
        </section>
        <ActivityStats />
        <ActivityHistory />
      </div>
    </main>
  );
}