"use client";

import {
  useState,
} from "react";

import {
  useWallet,
} from "@solana/wallet-adapter-react";

import {
  createCompany,
  type Company,
} from "@/lib/company";

type Props = {
  onCreated: (
    company: Company,
  ) => void;
};

export default function CompanyOnboarding({
  onCreated,
}: Props) {
  const {
    publicKey,
  } = useWallet();

  const [
    name,
    setName,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function submit() {
    if (!publicKey) {
      setError(
        "Connect your wallet first.",
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Enter your company name.",
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result =
        await createCompany(
          name,
          publicKey.toBase58(),
        );

      onCreated(result.company);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create company",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-sm font-medium text-white/50">
            TOKENVA
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Set up your company
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Create your company workspace
            before configuring payroll and
            treasury.
          </p>

          <label className="mt-8 block text-sm text-white/70">
            Company name

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Acme Labs"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </label>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Treasury wallet
            </p>

            <p className="mt-2 break-all text-sm text-white/70">
              {publicKey
                ? publicKey.toBase58()
                : "Connect your wallet"}
            </p>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating company..."
              : "Create company"}
          </button>

          {error && (
            <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
