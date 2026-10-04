"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

type HealthResponse = {
  ok: boolean;
  service: string;
  database: string;
  rpc: string;
  rpcEndpoints: number;
  uptimeSeconds: number;
  timestamp: string;
};

type MetricsResponse = {
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  rpcEndpoints: number;
  indexer: {
    lastSyncAt: string | null;
    indexedStreams: number;
  };
  transactions: Record<string, number>;
  jobs: Record<string, number>;
};

type CrossChainMessage = {
  id: string;
  gateway_tx_hash: string;
  action: string;
  operation_id: string;
  wormhole_sequence: string | null;
  source_chain: number;
  destination_chain: number;
  organization: string | null;
  employee: string | null;
  vaa_id: string | null;
  consume_tx_hash: string | null;
  destination_tx_hash: string | null;
  status: string;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type CrossChainResponse = {
  count: number;
  messages: CrossChainMessage[];
};

type DashboardState = {
  health: HealthResponse | null;
  metrics: MetricsResponse | null;
  messages: CrossChainMessage[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(
    (seconds % 86400) / 3600,
  );
  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function statusClass(status: string) {
  if (
    status === "failed" ||
    status === "error"
  ) {
    return "text-red-400";
  }

  if (
    status === "pending" ||
    status === "running"
  ) {
    return "text-yellow-400";
  }

  if (
    status === "confirmed" ||
    status === "destination_confirmed" ||
    status === "completed"
  ) {
    return "text-green-400";
  }

  return "text-zinc-300";
}

function totalCount(
  values: Record<string, number> | undefined,
) {
  return Object.values(values ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
}

export default function OperationalDashboard() {
  const [state, setState] =
    useState<DashboardState>({
      health: null,
      metrics: null,
      messages: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastRefresh, setLastRefresh] =
    useState<string | null>(null);

  const refresh = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          healthResponse,
          metricsResponse,
          messagesResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/health`, {
            cache: "no-store",
          }),
          fetch(
            `${API_BASE_URL}/api/ops/metrics`,
            {
              cache: "no-store",
            },
          ),
          fetch(
            `${API_BASE_URL}/api/cross-chain/messages?limit=8`,
            {
              cache: "no-store",
            },
          ),
        ]);

        if (
          !healthResponse.ok ||
          !metricsResponse.ok ||
          !messagesResponse.ok
        ) {
          throw new Error(
            "Operational API request failed",
          );
        }

        const [
          health,
          metrics,
          messagesData,
        ]: [
          HealthResponse,
          MetricsResponse,
          CrossChainResponse,
        ] = await Promise.all([
          healthResponse.json(),
          metricsResponse.json(),
          messagesResponse.json(),
        ]);

        setState({
          health,
          metrics,
          messages: messagesData.messages ?? [],
        });

        setLastRefresh(
          new Date().toISOString(),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load operational dashboard",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, 15_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refresh]);

  const healthOk =
    state.health?.ok ?? false;

  const transactionTotal =
    totalCount(
      state.metrics?.transactions,
    );

  const jobTotal =
    totalCount(
      state.metrics?.jobs,
    );

  return (
    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Operations
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Operational Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Live backend health, queue,
            transaction, indexer, and
            cross-chain operational state.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Backend
          </p>

          <p
            className={`mt-2 text-xl font-semibold ${
              healthOk
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {healthOk
              ? "Healthy"
              : "Unavailable"}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {state.health?.rpcEndpoints ?? 0} RPC
            endpoint
            {state.health?.rpcEndpoints === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Database
          </p>

          <p
            className={`mt-2 text-xl font-semibold ${
              state.health?.database ===
              "ok"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {state.health
              ? state.health.database ===
                "ok"
                ? "Healthy"
                : "Error"
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Solana RPC
          </p>

          <p
            className={`mt-2 text-xl font-semibold ${
              state.health?.rpc ===
              "ok"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {state.health
              ? state.health.rpc ===
                "ok"
                ? "Healthy"
                : "Error"
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Uptime
          </p>

          <p className="mt-2 text-xl font-semibold">
            {state.metrics
              ? formatUptime(
                  state.metrics
                    .uptimeSeconds,
                )
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Indexed Streams
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {state.metrics?.indexer
              .indexedStreams ?? "—"}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Last sync:{" "}
            {formatDate(
              state.metrics?.indexer
                .lastSyncAt ?? null,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Transactions
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {transactionTotal}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Confirmed:{" "}
            {state.metrics
              ?.transactions.confirmed ??
              0}
            {" · "}
            Failed:{" "}
            {state.metrics
              ?.transactions.failed ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Queue Jobs
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {jobTotal}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Pending:{" "}
            {state.metrics?.jobs.pending ??
              0}
            {" · "}
            Failed:{" "}
            {state.metrics?.jobs.failed ??
              0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Cross-Chain Messages
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {state.messages.length}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Showing latest 8
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div>
          <p className="text-sm text-zinc-400">
            Cross-Chain Message Operations
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Latest tracked control-plane
            messages and their execution state.
          </p>
        </div>

        {state.messages.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800 p-5 text-sm text-zinc-500">
            No cross-chain messages recorded.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {state.messages.map(
              (message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-zinc-800 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {message.action}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Operation{" "}
                        {message.operation_id}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-semibold capitalize ${statusClass(
                        message.status,
                      )}`}
                    >
                      {statusLabel(
                        message.status,
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-zinc-600">
                        Source → Destination
                      </p>

                      <p className="mt-1 text-zinc-300">
                        {message.source_chain} →{" "}
                        {
                          message.destination_chain
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-600">
                        Wormhole Sequence
                      </p>

                      <p className="mt-1 text-zinc-300">
                        {message.wormhole_sequence ??
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-600">
                        VAA
                      </p>

                      <p className="mt-1 text-zinc-300">
                        {message.vaa_id ?? "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-600">
                        Updated
                      </p>

                      <p className="mt-1 text-zinc-300">
                        {formatDate(
                          message.updated_at,
                        )}
                      </p>
                    </div>
                  </div>

                  {message.error && (
                    <p className="mt-3 rounded-lg border border-red-900/70 bg-red-950/20 p-3 text-xs text-red-300">
                      {message.error}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-600">
          Last dashboard refresh:{" "}
          {formatDate(lastRefresh)}
        </p>
      </div>
    </section>
  );
}
