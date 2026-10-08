"use client";

import { useState } from "react";

import {
  createApplication,
  type PilotApplication,
} from "@/lib/application";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

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

            <label className="block text-sm text-white/70">
              Country

              <div className="relative mt-2">
                <select
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 pr-11 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.06]"
                >
                  <option
                    value=""
                    className="bg-zinc-950 text-white/40"
                  >
                    Select country
                  </option>

                  {COUNTRIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-zinc-950 text-white"
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/35">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </label>

            <Field
              label="Team size"
              value={teamSize}
              onChange={setTeamSize}
              placeholder="10"
              type="number"
            />

            <label className="block text-sm text-white/70">
              Monthly stablecoin payroll volume

              <div className="relative mt-2">
                <select
                  value={
                    monthlyStablecoinPayrollVolume
                  }
                  onChange={(event) =>
                    setMonthlyStablecoinPayrollVolume(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 pr-11 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.06]"
                >
                  <option
                    value=""
                    className="bg-zinc-950 text-white/40"
                  >
                    Select volume
                  </option>

                  {VOLUMES.map((volume) => (
                    <option
                      key={volume}
                      value={volume}
                      className="bg-zinc-950 text-white"
                    >
                      {volume}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/35">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 transition focus:border-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
    </label>
  );
}