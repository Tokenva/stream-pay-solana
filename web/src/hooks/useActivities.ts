"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchActivities,
  type Activity,
} from "@/lib/backend";

const PAGE_SIZE = 5;

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [instruction, setInstruction] =
    useState<string>("all");

  const refresh = useCallback(
    async (nextOffset = 0) => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchActivities({
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        setActivities(result.activities);
        setTotal(result.total);
        setOffset(result.offset);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load activities",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh(0);
  }, [refresh]);

  const filteredActivities =
    instruction === "all"
      ? activities
      : activities.filter(
          (activity) =>
            activity.instruction === instruction,
        );

  const hasPrevious = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const nextPage = () => {
    if (!hasNext) return;
    void refresh(offset + PAGE_SIZE);
  };

  const previousPage = () => {
    if (!hasPrevious) return;
    void refresh(Math.max(0, offset - PAGE_SIZE));
  };

  const changeInstruction = (
    value: string,
  ) => {
    setInstruction(value);
  };

  return {
    activities: filteredActivities,
    loading,
    error,
    total,
    offset,
    limit: PAGE_SIZE,
    hasPrevious,
    hasNext,
    instruction,
    refresh: () => refresh(offset),
    nextPage,
    previousPage,
    changeInstruction,
  };
}