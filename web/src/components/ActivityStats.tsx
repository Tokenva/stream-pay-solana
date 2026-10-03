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
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
          />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-2xl border border-red-900 bg-red-950/30 p-4">
        <p className="text-sm text-red-400">
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
      label: "Total Activity",
      value: stats?.total ?? 0,
    },
    {
      label: "Streams Created",
      value: getCount("CreateStream"),
    },
    {
      label: "Stream Top-ups",
      value: getCount("TopUpStream"),
    },
    {
      label: "Streams Cancelled",
      value: getCount("CancelStream"),
    },
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
        >
          <p className="text-sm text-zinc-500">
            {card.label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            {card.value}
          </p>
        </div>
      ))}
    </section>
  );
}
