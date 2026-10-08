"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useStream,
} from "@/hooks/useStream";

import {
  useIndexedStreams,
} from "@/hooks/useIndexedStreams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { logout } from "@/lib/auth";

type EmployeeWorkspaceProps = {
  companyId: string;
  companyName: string;
  currentRole: string;
  walletAddress: string | null;
  companyOwnerAddress: string;
  mintAddress: string;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const BASE_UNITS = BigInt(1_000_000);
const ZERO = BigInt(0);

function formatTokenAmount(raw: bigint) {
  const whole = raw / BASE_UNITS;
  const fraction = raw % BASE_UNITS;

  if (fraction === ZERO) {
    return whole.toString();
  }

  return `${whole}.${fraction
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "")}`;
}

export default function EmployeeWorkspace({
  companyId,
  companyName,
  currentRole,
  walletAddress,
  companyOwnerAddress,
  mintAddress,
}: EmployeeWorkspaceProps) {
  const router = useRouter();
  const { disconnect } = useWallet();
  const [selectedStreamId, setSelectedStreamId] =
    useState(0);

  const employeeAddress =
    walletAddress ?? "";

  const {
    streams,
    loading: indexedStreamsLoading,
    error: indexedStreamsError,
    refresh: refreshIndexedStreams,
  } = useIndexedStreams(
    companyId,
    employeeAddress || undefined,
  );

  const selectedStream =
    streams.find(
      (item) =>
        Number.parseInt(
          item.stream_id,
          10,
        ) === selectedStreamId,
    ) ?? null;

const {
  data: streamData,
  claimable,
  loading: streamLoading,
  error: streamError,
  claim,
} = useStream(
  mintAddress,
  selectedStream
    ? Number.parseInt(
        selectedStream.stream_id,
        10,
      )
    : null,
  employeeAddress,
  companyOwnerAddress,
);

  useEffect(() => {
    if (streams.length === 0) {
      setSelectedStreamId(0);
      return;
    }

    const selectedExists = streams.some(
      (item) =>
        Number.parseInt(
          item.stream_id,
          10,
        ) === selectedStreamId,
    );

    if (!selectedExists) {
      setSelectedStreamId(
        Number.parseInt(
          streams[0].stream_id,
          10,
        ),
      );
    }
  }, [streams, selectedStreamId]);

  const totalScheduled = useMemo(
    () =>
      streams.reduce(
        (total, item) =>
          total +
          BigInt(item.total_amount),
        ZERO,
      ),
    [streams],
  );

  const totalClaimed = useMemo(
    () =>
      streams.reduce(
        (total, item) =>
          total +
          BigInt(item.claimed_amount),
        ZERO,
      ),
    [streams],
  );

  const activeStreams = streams.filter(
    (item) => !item.canceled,
  );

  async function handleClaim() {
    try {
      await claim();
      await refreshIndexedStreams();
    } catch {
      // useStream exposes the claim error.
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      try {
        await disconnect();
      } finally {
        router.replace("/login");
      }
    }
  }
  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="dashboard-brand-block">
            <p className="dashboard-eyebrow">
              Employee workspace
            </p>

            <h1 className="dashboard-title">
              TokenvaPay
            </h1>

            <p className="dashboard-subtitle">
              Your payroll, earnings, claims, and payment history in one secure workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="text-xs text-zinc-500">
              {walletAddress
                ? shortenAddress(walletAddress)
                : "Wallet"}
            </span>

            <Link
              href="/"
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Home
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="cursor-pointer rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <nav
          className="demo-nav"
          aria-label="Employee dashboard sections"
        >
          <a href="#my-company">My Company</a>
          <a href="#my-payroll">My Payroll</a>
          <a href="#claimable">Claimable</a>
          <a href="#payment-history">Payment History</a>
        </nav>

        <section
          id="my-company"
          className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            My Company
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {companyName}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            You are enrolled as an employee in this TokenvaPay
            workspace.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Role
              </p>

              <p className="mt-3 text-lg font-semibold">
                {currentRole}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Wallet
              </p>

              <p className="mt-3 break-all text-sm">
                {walletAddress
                  ? shortenAddress(walletAddress)
                  : "Not connected"}
              </p>
            </div>
          </div>
        </section>

        <section
          id="my-payroll"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            My Payroll
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            My payroll streams
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Total streams
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {streams.length}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Active
              </p>

              <p className="mt-3 text-2xl font-semibold text-green-400">
                {activeStreams.length}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Scheduled
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {formatTokenAmount(totalScheduled)}
              </p>
            </div>
          </div>

          {indexedStreamsLoading && (
            <div className="mt-6 rounded-xl border border-zinc-800 p-6">
              <p className="text-sm text-zinc-500">
                Loading your payroll streams...
              </p>
            </div>
          )}

          {indexedStreamsError && (
            <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/10 p-4">
              <p className="text-sm text-red-300">
                Unable to load your payroll streams.
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {indexedStreamsError}
              </p>
            </div>
          )}

          {!indexedStreamsLoading &&
            !indexedStreamsError &&
            streams.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <p className="text-sm font-medium">
                  No payroll streams found
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Your company has not assigned a payroll stream
                  to this wallet yet.
                </p>
              </div>
            )}

          {!indexedStreamsLoading &&
            !indexedStreamsError &&
            streams.length > 0 && (
              <div className="mt-6 space-y-3">
                {streams.map((item) => {
                  const itemStreamId =
                    Number.parseInt(
                      item.stream_id,
                      10,
                    );

                  const selected =
                    itemStreamId === selectedStreamId;

                  return (
                    <button
                      key={item.address}
                      type="button"
                      onClick={() =>
                        setSelectedStreamId(
                          itemStreamId,
                        )
                      }
                      className={`w-full rounded-xl border p-5 text-left transition ${selected
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-zinc-800 bg-black/20 hover:bg-white/[0.03]"
                        }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            Stream #{item.stream_id}
                          </p>

                          <p className="mt-1 break-all text-xs text-zinc-600">
                            {item.address}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-zinc-500">
                              Amount
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatTokenAmount(
                                BigInt(
                                  item.total_amount,
                                ),
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.canceled
                              ? "bg-red-500/10 text-red-400"
                              : "bg-green-500/10 text-green-400"
                              }`}
                          >
                            {item.canceled
                              ? "Canceled"
                              : "Active"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
        </section>

        <section
          id="claimable"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            Claimable
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Claim your earnings
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Selected stream
              </p>

              <p className="mt-3 text-lg font-semibold">
                {selectedStream
                  ? `Stream #${selectedStream.stream_id}`
                  : "No stream selected"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Claimable now
              </p>

              <p className="mt-3 text-2xl font-semibold text-green-400">
                {formatTokenAmount(claimable)}
              </p>
            </div>
          </div>

          {streamError && (
            <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/10 p-4">
              <p className="text-sm text-red-300">
                Unable to load the selected payroll stream.
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {streamError}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                Available earnings
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Claim funds that have vested under the selected
                payroll stream.
              </p>
            </div>

            <button
              type="button"
              disabled={
                streamLoading ||
                claimable === ZERO ||
                !streamData ||
                streamData.canceled
              }
              onClick={() => void handleClaim()}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {streamLoading
                ? "Processing..."
                : claimable > ZERO
                  ? `Claim ${formatTokenAmount(claimable)}`
                  : "Nothing to claim yet"}
            </button>
          </div>

          {streamData?.canceled && (
            <p className="mt-3 text-xs text-red-400">
              This stream has been canceled.
            </p>
          )}

          {selectedStream && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Stream total
                </p>

                <p className="mt-3 text-lg font-semibold">
                  {formatTokenAmount(
                    BigInt(
                      selectedStream.total_amount,
                    ),
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Already claimed
                </p>

                <p className="mt-3 text-lg font-semibold">
                  {formatTokenAmount(
                    BigInt(
                      selectedStream.claimed_amount,
                    ),
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        <section
          id="payment-history"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            Payment History
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Payroll payment history
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Total claimed
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {formatTokenAmount(totalClaimed)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Payroll streams
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {streams.length}
              </p>
            </div>
          </div>

          {streams.length > 0 ? (
            <div className="mt-6 space-y-3">
              {streams.map((item) => (
                <div
                  key={item.address}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        Stream #{item.stream_id}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Updated{" "}
                        {new Date(
                          item.updated_at,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-zinc-500">
                        Claimed
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatTokenAmount(
                          BigInt(
                            item.claimed_amount,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <p className="text-sm font-medium">
                No payment history available
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Completed and claimed payroll amounts will appear
                here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}