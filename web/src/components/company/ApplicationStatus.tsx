"use client";

import { useState } from "react";

import {
  getApplication,
  type PilotApplication,
} from "@/lib/application";

type Props = {
  application: PilotApplication;
  onRefresh: (
    application: PilotApplication,
  ) => void;
};

export default function ApplicationStatus({
  application,
  onRefresh,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const result =
        await getApplication();

      if (result.application) {
        onRefresh(result.application);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh application status.",
      );
    } finally {
      setLoading(false);
    }
  }

  const isPending =
    application.status === "pending";

  const isApproved =
    application.status === "approved";

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          TOKENVA
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/50">
                Design Partner Program
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {isPending
                  ? "Application under review"
                  : isApproved
                    ? "Application approved"
                    : "Application not approved"}
              </h1>
            </div>

            <StatusBadge
              status={application.status}
            />
          </div>

          <p className="mt-5 text-sm leading-6 text-white/50">
            {isPending
              ? "Your application has been received. Tokenva will review the information before granting pilot access."
              : isApproved
                ? "Your application has been approved. Your company will receive pilot access once the pilot is activated."
                : "Your design partner application was not approved for the current pilot."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard
              label="Company"
              value={application.company_name}
            />

            <InfoCard
              label="Country"
              value={application.country}
            />

            <InfoCard
              label="Team size"
              value={String(
                application.team_size,
              )}
            />

            <InfoCard
              label="Monthly volume"
              value={
                application.monthly_stablecoin_payroll_volume
              }
            />
          </div>

          {application.rejection_reason && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-red-300/60">
                Review note
              </p>

              <p className="mt-2 text-sm leading-6 text-red-200">
                {application.rejection_reason}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Checking status..."
              : "Check application status"}
          </button>

          <p className="mt-4 text-center text-xs text-white/25">
            Application ID: {application.id}
          </p>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: PilotApplication["status"];
}) {
  const label =
    status === "pending"
      ? "Pending"
      : status === "approved"
        ? "Approved"
        : "Rejected";

  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
      {label}
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-white/80">
        {value}
      </p>
    </div>
  );
}