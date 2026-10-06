"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  getCompanyAccess,
  type CompanyAccess,
} from "@/lib/company";

import { logout } from "@/lib/auth";

type Props = {
  access: CompanyAccess;
  onRefresh: (
    access: CompanyAccess,
  ) => void;
};

export default function PilotStatus({
  access,
  onRefresh,
}: Props) {
  const router = useRouter();

  const {
    disconnect,
  } = useWallet();

  const [loading, setLoading] =
    useState(false);

  const [
    switchingWallet,
    setSwitchingWallet,
  ] = useState(false);

  const [error, setError] =
    useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const result =
        await getCompanyAccess();

      onRefresh(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh pilot status.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function switchWallet() {
    setSwitchingWallet(true);
    setError("");

    try {
      await logout();
    } finally {
      try {
        await disconnect();
      } finally {
        router.replace("/login");
      }
    }
  }

  const company = access.company;

  if (!company) {
    return null;
  }

  const status =
    access.accessStatus ??
    company.pilot_status;

  const isApproved =
    status === "approved";

  const isActive =
    status === "active";

  const isExpired =
    status === "expired";

  const isRejected =
    status === "rejected";

  const title =
    isApproved
      ? "Pilot approved"
      : isActive
        ? "Pilot active"
        : isExpired
          ? "Pilot ended"
          : isRejected
            ? "Pilot not approved"
            : "Pilot access unavailable";

  const message =
    isApproved
      ? "Your company has been approved. Tokenva will activate your pilot before dashboard access is granted."
      : isActive
        ? "Your pilot is active. Dashboard access should be available after the next access check."
        : isExpired
          ? "Your design partner pilot has ended."
          : isRejected
            ? "Your Tokenva pilot was not approved."
            : "Your design partner pilot is not currently active.";

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          TOKENVA
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/50">
                Design Partner Pilot
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {company.name}
              </h1>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
              {status}
            </span>
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">

            <p className="text-xs uppercase tracking-wider text-white/30">
              {title}
            </p>

            <p className="mt-3 text-base font-medium text-white">
              {message}
            </p>

            {(company.pilot_start ||
              company.pilot_end) && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                {company.pilot_start && (
                  <InfoCard
                    label="Pilot start"
                    value={new Date(
                      company.pilot_start,
                    ).toLocaleString()}
                  />
                )}

                {company.pilot_end && (
                  <InfoCard
                    label="Pilot end"
                    value={new Date(
                      company.pilot_end,
                    ).toLocaleString()}
                  />
                )}

              </div>
            )}
          </div>

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
            disabled={
              loading ||
              switchingWallet
            }
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Checking pilot status..."
              : "Check pilot status"}
          </button>

          <button
            type="button"
            onClick={switchWallet}
            disabled={
              loading ||
              switchingWallet
            }
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {switchingWallet
              ? "Switching wallet..."
              : "Use another wallet"}
          </button>
        </section>
      </div>
    </main>
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

      <p className="mt-2 text-sm text-white/70">
        {value}
      </p>
    </div>
  );
}