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

  async function refresh() {
    setLoading(true);

    try {
      const result =
        await getApplication();

      if (result.application) {
        onRefresh(result.application);
      }
    } finally {
      setLoading(false);
    }
  }

  const rejected =
    application.status === "rejected";

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-sm font-medium text-white/50">
          TOKENVA
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {rejected
            ? "Application not approved"
            : "Application under review"}
        </h1>

        <p className="mt-4 text-sm leading-6 text-white/55">
          {rejected
            ? "Your design partner application was not approved."
            : "Your design partner application has been received. Tokenva will review it before granting pilot access."}
        </p>

        <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <Row
            label="Company"
            value={application.company_name}
          />

          <Row
            label="Website"
            value={application.company_website}
          />

          <Row
            label="Country"
            value={application.country}
          />

          <Row
            label="Team size"
            value={String(application.team_size)}
          />

          <Row
            label="Monthly volume"
            value={
              application.monthly_stablecoin_payroll_volume
            }
          />

          {application.rejection_reason && (
            <Row
              label="Reason"
              value={
                application.rejection_reason
              }
            />
          )}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading
            ? "Refreshing..."
            : "Refresh application status"}
        </button>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-white/75">
        {value}
      </p>
    </div>
  );
}