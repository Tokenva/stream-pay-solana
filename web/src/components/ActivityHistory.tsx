"use client";

import { useActivities } from "@/hooks/useActivities";

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

export default function ActivityHistory() {
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
  } = useActivities();

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Protocol Activity
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Activity History
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {total} indexed activities
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={instruction}
            onChange={(event) =>
              changeInstruction(event.target.value)
            }
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
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
          </select>

          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-zinc-500">
          Loading activity...
        </p>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        activities.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">
            No activity found.
          </p>
        )}

      {!loading &&
        !error &&
        activities.length > 0 && (
          <div className="mt-6 space-y-3">
            {activities.map((activity) => (
              <div
                key={`${activity.signature}-${activity.instruction_index}`}
                className="rounded-xl border border-zinc-800 p-4 transition hover:bg-zinc-900/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {getInstructionLabel(
                        activity.instruction,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatTime(
                        activity.block_time,
                      )}
                    </p>
                  </div>

                  <span className="text-xs text-zinc-500">
                    Slot {activity.slot}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-zinc-400 sm:grid-cols-3">
                  <div>
                    <span className="text-zinc-600">
                      Stream
                    </span>

                    <div className="mt-1">
                      {shorten(
                        activity.stream_address,
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-600">
                      Employee
                    </span>

                    <div className="mt-1">
                      {shorten(
                        activity.employee,
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-600">
                      Organization
                    </span>

                    <div className="mt-1">
                      {shorten(
                        activity.organization,
                      )}
                    </div>
                  </div>
                </div>

                <a
                  href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-xs text-zinc-300 underline underline-offset-4 hover:text-white"
                >
                  View transaction
                </a>
              </div>
            ))}
          </div>
        )}

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
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
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={nextPage}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}