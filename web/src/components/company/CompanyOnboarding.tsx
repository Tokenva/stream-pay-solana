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

    if (
      !companyName.trim() ||
      !companyWebsite.trim() ||
      !workEmail.trim() ||
      !country.trim() ||
      !teamSize.trim() ||
      !monthlyStablecoinPayrollVolume ||
      !primaryUseCase.trim() ||
      !whyTokenva.trim()
    ) {
      setError(
        "Please complete all application fields.",
      );
      return;
    }

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
    <main className="min-h-screen bg-black px-5 py-10 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            TOKENVA
          </p>

          <div className="mt-6 flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-2 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                1
              </span>
              Application
            </span>

            <span className="h-px w-8 bg-white/10" />

            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10">
                2
              </span>
              Review
            </span>

            <span className="h-px w-8 bg-white/10" />

            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10">
                3
              </span>
              Pilot
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 sm:p-8">

          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/50">
              Design Partner Program
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Bring your payroll workflow to Tokenva.
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/50 sm:text-base">
              Tell us about your company, payroll needs,
              and the problem you want to solve with
              programmable stablecoin payroll.
            </p>
          </div>

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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/30"
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
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 transition focus:border-white/30"
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
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 transition focus:border-white/30"
            />
          </label>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-6 cursor-pointer w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting application..."
              : "Submit design partner application"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-white/30">
            Tokenva will review your application before
            granting pilot access.
          </p>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 transition focus:border-white/30"
      />
    </label>
  );
}