"use client";

import { useState } from "react";
import {
  getCompanyAccess,
  type CompanyAccess,
} from "@/lib/company";

type Props = {
  access: CompanyAccess;
};

const statusContent = {
  pending: {
    title: "Application under review",
    message:
      "Your company has been submitted to Tokenva. Our team is reviewing your design partner application.",
  },
  approved: {
    title: "You're approved",
    message:
      "Your company has been approved. Your workspace will become available as soon as your pilot is activated.",
  },
  expired: {
    title: "Pilot completed",
    message:
      "Your Tokenva pilot has ended. Contact the Tokenva team if you would like to continue.",
  },
  rejected: {
    title: "Application not approved",
    message:
      "This company is not currently approved for the Tokenva pilot.",
  },
  active: {
    title: "Pilot active",
    message:
      "Your Tokenva pilot is active and your workspace is ready.",
  },
} as const;

export default function PilotStatus({
  access,
}: Props) {
  const [refreshing, setRefreshing] =
    useState(false);

  const status =
    access.accessStatus ?? "pending";

  const content =
    statusContent[status];

  async function checkStatus() {
    setRefreshing(true);

    try {
      const latest =
        await getCompanyAccess();

      if (
        latest.hasDashboardAccess
      ) {
        window.location.reload();
        return;
      }

      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

            <p className="text-sm font-medium text-white/40">
              TOKENVA DESIGN PARTNER
            </p>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {content.title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/55">
            {content.message}
          </p>

          {status === "pending" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white/80">
                What happens next?
              </p>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Once your application is approved
                and your pilot is activated, this
                page will automatically become your
                Tokenva company workspace.
              </p>
            </div>
          )}

          {access.company && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-wider text-white/35">
                Company
              </p>

              <p className="mt-2 text-sm text-white/80">
                {access.company.name}
              </p>

              <p className="mt-4 text-xs uppercase tracking-wider text-white/35">
                Pilot status
              </p>

              <p className="mt-2 text-sm capitalize text-white/80">
                {status}
              </p>

              {access.company.pilot_start && (
                <>
                  <p className="mt-4 text-xs uppercase tracking-wider text-white/35">
                    Pilot start
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {new Date(
                      access.company.pilot_start,
                    ).toLocaleString()}
                  </p>
                </>
              )}

              {access.company.pilot_end && (
                <>
                  <p className="mt-4 text-xs uppercase tracking-wider text-white/35">
                    Pilot end
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {new Date(
                      access.company.pilot_end,
                    ).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={checkStatus}
            disabled={refreshing}
            className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Checking status..."
              : "Check pilot status"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-white/30">
            You can leave this page open. Your
            company workspace will become available
            when your pilot is activated.
          </p>
        </section>
      </div>
    </main>
  );
}