"use client";

import { useActivities } from "@/hooks/useActivities";

type ActivityHistoryProps = {
  companyId: string;
};

function shorten(value: string | null) {
  if (!value) return "—";

  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function formatTime(blockTime: string | null) {
  if (!blockTime) {
    return "Pending";
  }

  return new Date(
    Number(blockTime) * 1000,
  ).toLocaleString();
}

function getInstructionLabel(
  instruction: string,
) {
  switch (instruction) {
    case "CreateStream":
      return "Create Stream";

    case "TopUpStream":
      return "Top Up Stream";

    case "CancelStream":
      return "Cancel Stream";

    case "Claim":
      return "Claim";

    case "Deposit":
      return "Deposit";

    default:
      return instruction;
  }
}

function getInstructionTone(
  instruction: string,
) {
  switch (instruction) {
    case "CreateStream":
      return "border-green-900/70 bg-green-950/20 text-green-400";

    case "TopUpStream":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";

    case "CancelStream":
      return "border-red-900/70 bg-red-950/20 text-red-400";

    case "Claim":
      return "border-blue-900/70 bg-blue-950/20 text-blue-400";

    case "Deposit":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";

    default:
      return "border-zinc-800 bg-zinc-900 text-zinc-400";
  }
}

export default function ActivityHistory({
  companyId,
}: ActivityHistoryProps) {
  const {
    activities,
    loading,
    error,
    total,
    offset,
    limit,
    hasPrevious,
    hasNext,
    instruction,
    refresh,
    nextPage,
    previousPage,
    changeInstruction,
  } = useActivities(companyId);

  return (
    <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Protocol Activity
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">
            Activity history
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {total} indexed activities
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={instruction}
            onChange={(event) =>
              changeInstruction(event.target.value)
            }
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
          >
            <option value="all">
              All activities
            </option>

            <option value="CreateStream">
              Create Stream
            </option>

            <option value="TopUpStream">
              Top Up Stream
            </option>

            <option value="CancelStream">
              Cancel Stream
            </option>

            <option value="Claim">
              Claim
            </option>

            <option value="Deposit">
              Deposit
            </option>
          </select>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && activities.length === 0 && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl border border-zinc-800 bg-black/20"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-900/70 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        activities.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-sm font-medium text-zinc-400">
              No activity found
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Try another activity filter or refresh the history.
            </p>
          </div>
        )}

      {!error && activities.length > 0 && (
        <div className="mt-6 space-y-3">
          {activities.map((activity) => (
            <article
              key={`${activity.signature}-${activity.instruction_index}`}
              className="rounded-xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/30"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-400">
                    {activity.instruction.slice(0, 1)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {getInstructionLabel(
                          activity.instruction,
                        )}
                      </p>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getInstructionTone(
                          activity.instruction,
                        )}`}
                      >
                        {activity.instruction}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      {formatTime(activity.block_time)}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-zinc-600">
                  Slot {activity.slot}
                </span>
              </div>

              <div className="mt-4 grid gap-3 border-t border-zinc-900 pt-4 sm:grid-cols-3">
                <AddressField
                  label="Stream"
                  value={shorten(activity.stream_address)}
                />

                <AddressField
                  label="Employee"
                  value={shorten(activity.employee)}
                />

                <AddressField
                  label="Organization"
                  value={shorten(activity.organization)}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-900 pt-4">
                <p className="max-w-[70%] truncate text-xs text-zinc-600">
                  {activity.signature}
                </p>

                <a
                  href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs font-medium text-zinc-300 underline underline-offset-4 transition hover:text-white"
                >
                  View transaction
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          {total === 0
            ? "No activities"
            : `${offset + 1}-${Math.min(
                offset + limit,
                total,
              )} of ${total}`}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrevious || loading}
            onClick={previousPage}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={nextPage}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function AddressField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        {value}
      </p>
    </div>
  );
}