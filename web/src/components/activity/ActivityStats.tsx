"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

type ActivityStatsResponse = {
  total: number;
  byInstruction: {
    instruction: string;
    count: number;
  }[];
};

export default function ActivityStats() {
  const [stats, setStats] =
    useState<ActivityStatsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/activities/stats`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch activity stats",
          );
        }

        const data =
          (await response.json()) as ActivityStatsResponse;

        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load activity stats",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  if (loading) {
    return (
      <section className="mt-6">
        <div className="mb-4">
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-6 w-48 animate-pulse rounded bg-zinc-800" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-2xl border border-red-900/70 bg-red-950/20 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
          Activity
        </p>

        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      </section>
    );
  }

  const getCount = (name: string) =>
    stats?.byInstruction.find(
      (item) => item.instruction === name,
    )?.count ?? 0;

  const cards = [
    {
      label: "Total activity",
      value: stats?.total ?? 0,
      description: "Indexed protocol events",
    },
    {
      label: "Streams created",
      value: getCount("CreateStream"),
      description: "New payroll streams",
    },
    {
      label: "Stream top-ups",
      value: getCount("TopUpStream"),
      description: "Funding updates",
    },
    {
      label: "Streams canceled",
      value: getCount("CancelStream"),
      description: "Canceled streams",
    },
  ];

  return (
    <section className="mt-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Protocol Activity
        </p>

        <h2 className="mt-2 text-lg font-semibold text-white">
          Activity overview
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Indexed protocol actions across the workspace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className={`rounded-2xl border p-5 ${
              index === 0
                ? "border-zinc-700 bg-zinc-950"
                : "border-zinc-800 bg-zinc-950"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                {card.label}
              </p>

              <span className="h-2 w-2 rounded-full bg-zinc-600" />
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {card.value}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}