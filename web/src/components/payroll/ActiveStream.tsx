"use client";

type ActiveStreamProps = {
  streamData: {
    totalAmount: bigint | { toString(): string };
    canceled: boolean;
  } | null;
  stream: {
    toBase58(): string;
  } | null;
  streamEscrow: {
    toBase58(): string;
  } | null;
  claimable: bigint;
  earnedDisplay: string;
  streamLoading: boolean;
  streamError: string | null;
  actionLoading: boolean;
  actionErrorStream: string | null;
  canTopUpStream: boolean;
  canCancelStream: boolean;
  currentRole: string;
  indexedStreams: Array<{
    address: string;
    stream_id: string;
    canceled: boolean;
  }>;
  indexedStreamsLoading: boolean;
  indexedStreamsError: string | null;
  onTopUp: () => void;
  onCancel: () => void;
  onClaim: () => void;
  onRefreshIndexedStreams: () => void;
  shortenAddress: (address: string) => string;
  formatTokenAmount: (raw: bigint) => string;
};

export default function ActiveStream({
  streamData,
  stream,
  streamEscrow,
  claimable,
  earnedDisplay,
  streamLoading,
  streamError,
  actionLoading,
  actionErrorStream,
  canTopUpStream,
  canCancelStream,
  currentRole,
  indexedStreams,
  indexedStreamsLoading,
  indexedStreamsError,
  onTopUp,
  onCancel,
  onClaim,
  onRefreshIndexedStreams,
  shortenAddress,
  formatTokenAmount,
}: ActiveStreamProps) {
  const activeIndexedStreams =
    indexedStreams.filter(
      (item) => !item.canceled,
    ).length;

  const canceledIndexedStreams =
    indexedStreams.filter(
      (item) => item.canceled,
    ).length;

  return (
    <>
      <section
        id="live-payroll"
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
            04
          </span>

          <div>
            <p className="text-sm text-zinc-400">
              Live Payroll
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Active payment stream
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Monitor the current payment stream, claim
              available funds, and manage the stream when your
              role allows it.
            </p>
          </div>
        </div>

        {streamData ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Stream
                </p>

                <p className="mt-3 break-all text-sm">
                  {stream
                    ? shortenAddress(
                      stream.toBase58(),
                    )
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Total amount
                </p>

                <p className="mt-3 text-2xl font-semibold">
                  {formatTokenAmount(
                    BigInt(
                      streamData.totalAmount.toString(),
                    ),
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Claimable
                </p>

                <p className="mt-3 text-2xl font-semibold text-green-400">
                  {earnedDisplay}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Status
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${streamData.canceled
                      ? "bg-red-400"
                      : "bg-green-400"
                      }`}
                  />

                  <span
                    className={
                      streamData.canceled
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {streamData.canceled
                      ? "Canceled"
                      : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Stream management
                  </p>

                  <p
                    className={`mt-1 text-sm ${canTopUpStream || canCancelStream
                        ? "text-green-400"
                        : "text-zinc-600"
                      }`}
                  >
                    {canTopUpStream
                      ? `${currentRole} can top up this stream.`
                      : canCancelStream
                        ? `${currentRole} can cancel this stream.`
                        : `${currentRole} has read-only stream access.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !canTopUpStream ||
                      streamData.canceled
                    }
                    onClick={onTopUp}
                    className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Top Up 100"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !canCancelStream ||
                      streamData.canceled
                    }
                    onClick={onCancel}
                    className="rounded-xl border border-red-900 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Cancel Stream"}
                  </button>
                </div>
              </div>

              {actionErrorStream && (
                <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/10 p-3">
                  <p className="text-sm text-red-300">
                    We couldn&apos;t complete that action.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Please try again.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Stream escrow
                </p>

                <p className="mt-3 break-all text-sm">
                  {streamEscrow
                    ? shortenAddress(
                      streamEscrow.toBase58(),
                    )
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Available to claim
                </p>

                <p className="mt-3 text-2xl font-semibold">
                  {earnedDisplay}
                </p>
              </div>
            </div>

            {streamError && (
              <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-4">
                <p className="text-sm text-red-300">
                  We couldn&apos;t load this payment stream.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Please refresh and try again.
                </p>
              </div>
            )}
            {currentRole === "Employee" && (

              <div className="rounded-xl border border-zinc-800 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Employee claim
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Claim funds that have become available
                      under the current stream.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      streamLoading ||
                      claimable === BigInt(0) ||
                      streamData.canceled
                    }
                    onClick={onClaim}
                    className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {streamLoading
                      ? "Processing..."
                      : claimable > BigInt(0)
                        ? `Claim ${earnedDisplay}`
                        : "Nothing to claim yet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-sm font-medium">
              No active stream found
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              No stream was found for the current wallet and
              Stream ID.
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm text-zinc-400">
                Stream Registry
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Indexed Streams
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Streams indexed by the Tokenva backend.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshIndexedStreams}
            disabled={indexedStreamsLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {indexedStreamsLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {!indexedStreamsLoading &&
          !indexedStreamsError &&
          indexedStreams.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Total streams
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {indexedStreams.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Active
                </p>

                <p className="mt-1 text-2xl font-semibold text-green-400">
                  {activeIndexedStreams}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Canceled
                </p>

                <p className="mt-1 text-2xl font-semibold text-red-400">
                  {canceledIndexedStreams}
                </p>
              </div>
            </div>
          )}

        {indexedStreamsLoading && (
          <div className="mt-6 rounded-xl border border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">
              Loading indexed streams...
            </p>
          </div>
        )}

        {indexedStreamsError && (
          <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/10 p-4">
            <p className="text-sm text-red-300">
              We couldn&apos;t refresh the stream registry.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Try refreshing again in a moment.
            </p>
          </div>
        )}

        {!indexedStreamsLoading &&
          !indexedStreamsError &&
          indexedStreams.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <p className="text-sm font-medium">
                No indexed streams found
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                Refresh the registry after creating a payment
                stream.
              </p>
            </div>
          )}

        {!indexedStreamsLoading &&
          !indexedStreamsError &&
          indexedStreams.length > 0 && (
            <div className="mt-6 space-y-3">
              {indexedStreams.map((item) => (
                <div
                  key={item.address}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Stream #{item.stream_id}
                      </p>

                      <p className="mt-1 break-all text-xs text-zinc-600">
                        {item.address}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${item.canceled
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
              ))}
            </div>
          )}
      </section>
    </>
  );
}