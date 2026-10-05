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
  canManageStreams: boolean;
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
  canManageStreams,
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
  return (
    <>
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
                    ? shortenAddress(stream.toBase58())
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Total
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatTokenAmount(
                    BigInt(streamData.totalAmount.toString()),
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

              <div className="mt-4 rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Stream Management
                </p>

                <p
                  className={`mt-2 text-sm ${
                    canManageStreams
                      ? "text-green-400"
                      : "text-zinc-600"
                  }`}
                >
                  {canManageStreams
                    ? `${currentRole} can top up and cancel streams.`
                    : `${currentRole} has read-only stream access.`}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    actionLoading ||
                    !canManageStreams ||
                    streamData.canceled
                  }
                  onClick={onTopUp}
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
                    !canManageStreams ||
                    streamData.canceled
                  }
                  onClick={onCancel}
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
                {shortenAddress(streamEscrow.toBase58())}
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
                claimable === BigInt(0) ||
                streamData.canceled
              }
              onClick={onClaim}
              className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
            >
              {streamLoading
                ? "Processing..."
                : claimable > BigInt(0)
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
            onClick={onRefreshIndexedStreams}
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
          {indexedStreams.map((item) => (
            <div
              key={item.address}
              className="rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <span>
                  Stream #{item.stream_id}
                </span>

                <span
                  className={
                    item.canceled
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {item.canceled
                    ? "Canceled"
                    : "Active"}
                </span>
              </div>

              <div className="mt-2 text-xs text-white/50">
                {item.address}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
