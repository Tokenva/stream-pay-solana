"use client";

import { useState } from "react";

import {
  createApplication,
  type PilotApplication,
} from "@/lib/application";

type Props = {
  onSubmitted: (
    application: PilotApplication,
  ) => void;
};

const VOLUMES = [
  "Under $10K",
  "$10K - $50K",
  "$50K - $250K",
  "$250K - $1M",
  "$1M+",
];

export default function CompanyOnboarding({
  onSubmitted,
}: Props) {
  const [companyName, setCompanyName] =
    useState("");

  const [companyWebsite, setCompanyWebsite] =
    useState("");

  const [workEmail, setWorkEmail] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [teamSize, setTeamSize] =
    useState("");

  const [
    monthlyStablecoinPayrollVolume,
    setMonthlyStablecoinPayrollVolume,
  ] = useState("");

  const [primaryUseCase, setPrimaryUseCase] =
    useState("");

  const [whyTokenva, setWhyTokenva] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit() {
    setError("");

    const numericTeamSize =
      Number(teamSize);

    if (
      !Number.isInteger(numericTeamSize) ||
      numericTeamSize < 1
    ) {
      setError(
        "Enter a valid team size.",
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await createApplication({
          companyName,
          companyWebsite,
          workEmail,
          country,
          teamSize: numericTeamSize,
          monthlyStablecoinPayrollVolume,
          primaryUseCase,
          whyTokenva,
        });

      onSubmitted(result.application);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit application",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-sm font-medium text-white/50">
            TOKENVA
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Join the Tokenva Design Partner Program
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Tell us about your team and how you
            plan to use programmable stablecoin
            payroll.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field
              label="Company name"
              value={companyName}
              onChange={setCompanyName}
              placeholder="Acme Labs"
            />

            <Field
              label="Company website"
              value={companyWebsite}
              onChange={setCompanyWebsite}
              placeholder="https://acme.com"
            />

            <Field
              label="Work email"
              value={workEmail}
              onChange={setWorkEmail}
              placeholder="you@acme.com"
              type="email"
            />

            <Field
              label="Country"
              value={country}
              onChange={setCountry}
              placeholder="United States"
            />

            <Field
              label="Team size"
              value={teamSize}
              onChange={setTeamSize}
              placeholder="10"
              type="number"
            />

            <label className="block text-sm text-white/70">
              Monthly stablecoin payroll volume
              <select
                value={
                  monthlyStablecoinPayrollVolume
                }
                onChange={(event) =>
                  setMonthlyStablecoinPayrollVolume(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
              >
                <option value="">
                  Select volume
                </option>

                {VOLUMES.map((volume) => (
                  <option
                    key={volume}
                    value={volume}
                    className="bg-black"
                  >
                    {volume}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 block text-sm text-white/70">
            Primary use case
            <textarea
              value={primaryUseCase}
              onChange={(event) =>
                setPrimaryUseCase(
                  event.target.value,
                )
              }
              placeholder="Global contractor and employee payroll..."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </label>

          <label className="mt-5 block text-sm text-white/70">
            Why Tokenva?
            <textarea
              value={whyTokenva}
              onChange={(event) =>
                setWhyTokenva(
                  event.target.value,
                )
              }
              placeholder="What problem are you trying to solve?"
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting application..."
              : "Apply for design partner pilot"}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block text-sm text-white/70">
      {label}

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
      />
    </label>
  );
}