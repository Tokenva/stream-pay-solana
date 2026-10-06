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

  async function refresh() {
    setLoading(true);

    try {
      const result =
        await getCompanyAccess();

      onRefresh(result);
    } finally {
      setLoading(false);
    }
  }

  async function switchWallet() {
    setSwitchingWallet(true);

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

  const message =
    access.accessStatus === "approved"
      ? "Your company has been approved. Tokenva will activate your pilot before dashboard access is granted."
      : access.accessStatus === "expired"
        ? "Your design partner pilot has ended."
        : access.accessStatus === "rejected"
          ? "Your Tokenva pilot application was not approved."
          : "Your design partner pilot is not currently active.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-sm font-medium text-white/50">
          TOKENVA
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {company.name}
        </h1>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-wider text-white/35">
            Pilot status
          </p>

          <p className="mt-2 text-lg font-medium">
            {company.pilot_status}
          </p>

          <p className="mt-3 text-sm leading-6 text-white/55">
            {message}
          </p>

          {company.pilot_start && (
            <p className="mt-4 text-sm text-white/50">
              Start:{" "}
              {new Date(
                company.pilot_start,
              ).toLocaleString()}
            </p>
          )}

          {company.pilot_end && (
            <p className="mt-1 text-sm text-white/50">
              End:{" "}
              {new Date(
                company.pilot_end,
              ).toLocaleString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={
            loading ||
            switchingWallet
          }
          className="mt-6 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading
            ? "Refreshing..."
            : "Refresh pilot status"}
        </button>

        <button
          type="button"
          onClick={switchWallet}
          disabled={
            loading ||
            switchingWallet
          }
          className="mt-3 w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {switchingWallet
            ? "Switching wallet..."
            : "Use another wallet"}
        </button>
      </section>
    </main>
  );
}