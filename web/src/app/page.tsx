"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const capabilities = [

  {

    number: "01",

    title: "Programmable payment streams",

    text: "Define recurring payment flows instead of manually initiating every individual transfer.",

  },

  {

    number: "02",

    title: "Stablecoin infrastructure",

    text: "Designed around digital-dollar payment workflows for internationally distributed teams.",

  },

  {

    number: "03",

    title: "Cross-chain workflows",

    text: "Coordinate payment operations across supported blockchain environments.",

  },

  {

    number: "04",

    title: "Transparent settlement",

    text: "On-chain activity provides a verifiable settlement layer for clearer reconciliation.",

  },

];

const steps = [

  {

    number: "01",

    title: "Fund",

    text: "The company funds the payment environment with supported assets.",

  },

  {

    number: "02",

    title: "Create",

    text: "The company defines the recipient and programmable payment stream.",

  },

  {

    number: "03",

    title: "Claim",

    text: "Employees or contractors claim available payments according to the configured stream.",

  },

  {

    number: "04",

    title: "Reconcile",

    text: "Operations teams can track payment activity and settlement history.",

  },

];

export default function LandingPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    void getSession().then((session) => {
      if (active) {
        setAuthenticated(Boolean(session?.authenticated));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const accessHref = authenticated ? "/app" : "/login";
  const accessLabel = authenticated ? "Dashboard" : "Get started";

  return (

    <main className="min-h-screen scroll-smooth bg-black text-white">

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="text-lg font-semibold tracking-[-0.03em]">

            TokenvaPay

          </Link>

          <div className="hidden items-center gap-7 text-sm text-white/55 md:flex">

            <Link href="#product" className="transition hover:text-white">Product</Link>

            <Link href="#how-it-works" className="transition hover:text-white">How it works</Link>

            <Link href="#technology" className="transition hover:text-white">Technology</Link>

            <Link href="#security" className="transition hover:text-white">Security</Link>

            <Link href="#design-partners" className="transition hover:text-white">Design partners</Link>
          </div>

          <div className="flex items-center gap-2">

            {!authenticated && (
              <Link

              href="/login"

              className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:border-white/40 hover:bg-white/5 sm:inline-flex md:hidden"

            >

              Login

            </Link>
            )}

            <Link
              href={accessHref}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              {accessLabel}
            </Link>

            <details className="relative md:hidden">

              <summary

                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/30 hover:text-white [&::-webkit-details-marker]:hidden"

                aria-label="Open navigation menu"

              >

                <span className="sr-only">Open navigation menu</span>

                <span className="flex flex-col gap-1.5">

                  <span className="block h-px w-4 bg-current" />

                  <span className="block h-px w-4 bg-current" />

                </span>

              </summary>

              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">

                <Link href="#product" className="block rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Product</Link>

                <Link href="#how-it-works" className="block rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">How it works</Link>

                <Link href="#technology" className="block rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Technology</Link>

                <Link href="#security" className="block rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Security</Link>

                <Link href="#design-partners" className="block rounded-xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Design partners</Link>

                <div className="my-2 border-t border-white/10" />

                {authenticated ? (
                  <Link href="/app" className="block rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="block rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5">
                    Login
                  </Link>
                )}

              </div>

            </details>

          </div>

        </div>

      </div>

    </nav>

      <section className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">

          <div className="max-w-5xl">

            <p className="mb-6 text-xs font-medium uppercase tracking-[0.28em] text-white/45">

              Programmable payment infrastructure

            </p>

            <h1 className="max-w-5xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl">

              Payments built for

              <br />

              global teams.

            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/55 sm:text-xl">

              TokenvaPay provides programmable payment infrastructure for

              distributed teams — enabling recurring stablecoin payments,

              transparent settlement, and cross-chain workflows.

            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">

              <Link
              href={accessHref}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              {accessLabel}
            </Link>

              <Link

                href="#product"

                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white"

              >

                Explore TokenvaPay

              </Link>

            </div>

          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-white/35">

            <span>TokenvaPay</span>

            <span aria-hidden="true">·</span>

            <span>A product of</span>

            <Link href="https\://tokenva-web.vercel.app" target="\_blank" rel="noreferrer" className="text-white/55 transition hover:text-white">

              Tokenva

            </Link>

          </div>

          <div className="mt-24 grid border-t border-white/10 pt-6 text-xs uppercase tracking-[0.18em] text-white/35 sm:grid-cols-3">

            <span>Payments</span>

            <span>Stablecoins</span>

            <span>On-chain settlement</span>

          </div>

        </div>

      </section>

      <section id="product" className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">

                01 / The problem

              </p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                Global payments are still too manual.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                Distributed companies often rely on wallets, spreadsheets,

                manual transfers, and disconnected payment records to pay

                international teams. TokenvaPay is designed to turn that

                fragmented process into a programmable payment workflow.

              </p>

              <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">

                {[

                  ["01", "Manual operations", "Repeated transfers and wallet management create unnecessary operational work."],

                  ["02", "Limited visibility", "Finance teams need a clearer picture of what was funded, streamed, claimed, and settled."],

                  ["03", "Fragmented rails", "Global teams operate across multiple chains, assets, wallets, and payment environments."],

                ].map(([number, title, text]) => (

                  <div key={number} className="bg-black p-6">

                    <span className="text-xs text-white/30">{number}</span>

                    <h3 className="mt-12 text-lg font-medium">{title}</h3>

                    <p className="mt-3 text-sm leading-6 text-white/45">

                      {text}

                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">

                02 / TokenvaPay

              </p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                One programmable layer for recurring payments.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                TokenvaPay is being built as payment infrastructure — not simply

                another payroll dashboard.

              </p>

              <div className="mt-14 rounded-2xl border border-white/10">

                <div className="border-b border-white/10 p-6">

                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">

                    Payment flow

                  </p>

                  <h3 className="mt-2 text-xl font-medium">

                    Programmable payroll stream

                  </h3>

                </div>

                <div className="grid divide-y divide-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">

                  {[

                    ["01", "Company", "Funds treasury"],

                    ["02", "Stream", "Programmable payment"],

                    ["03", "Employee", "Claims payment"],

                    ["04", "Settlement", "Track & reconcile"],

                  ].map(([number, title, text]) => (

                    <div key={number} className="p-6">

                      <span className="text-xs text-white/30">{number}</span>

                      <p className="mt-10 text-sm font-medium">{title}</p>

                      <p className="mt-2 text-xs text-white/40">{text}</p>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="mb-14">

            <p className="text-xs uppercase tracking-[0.25em] text-white/35">

              03 / Capabilities

            </p>

          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">

            {capabilities.map((item) => (

              <div key={item.number} className="bg-black p-8 lg:p-10">

                <span className="text-xs text-white/30">{item.number}</span>

                <h3 className="mt-16 text-xl font-medium">{item.title}</h3>

                <p className="mt-4 max-w-md text-sm leading-6 text-white/45">

                  {item.text}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      <section id="how-it-works" className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">

                04 / How it works

              </p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                Simple for the team.

                <br />

                Programmable underneath.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                The goal is to make the payment experience understandable for

                companies while the underlying infrastructure handles the

                programmable settlement logic.

              </p>

              <div className="mt-14 divide-y divide-white/10 border-y border-white/10">

                {steps.map((step) => (

                  <div

                    key={step.number}

                    className="grid gap-4 py-7 sm:grid-cols-[80px_180px_1fr]"

                  >

                    <span className="text-xs text-white/30">

                      {step.number}

                    </span>

                    <h3 className="font-medium">{step.title}</h3>

                    <p className="text-sm leading-6 text-white/45">

                      {step.text}

                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      <section id="technology" className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">

                05 / Technology

              </p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                Infrastructure for programmable money.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                TokenvaPay is being developed with a blockchain-native

                architecture designed around programmable payments and

                cross-chain operations.

              </p>

              <div className="mt-14 grid gap-3 sm:grid-cols-2">

                {[

                  ["Solana", "Core programmable payment infrastructure", "DEVNET"],

                  ["EVM", "Cross-chain gateway infrastructure", "TESTNET"],

                  ["Stablecoins", "Digital-dollar payment workflows", "SUPPORTED"],

                  ["Cross-chain messaging", "Coordinated multi-chain operations", "TESTING"],

                ].map(([title, text, status]) => (

                  <div

                    key={title}

                    className="rounded-2xl border border-white/10 p-6"

                  >

                    <div className="flex items-center justify-between gap-4">

                      <h3 className="font-medium">{title}</h3>

                      <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">

                        {status}

                      </span>

                    </div>

                    <p className="mt-8 text-sm leading-6 text-white/45">

                      {text}

                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      <section id="security" className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">

                06 / Security

              </p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                Built with security as a requirement.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                TokenvaPay is being developed with explicit policy enforcement,

                transaction verification, cross-chain validation, cancellation

                controls, backend protections, and incident-response

                procedures.

              </p>

              <div className="mt-12 grid gap-3 sm:grid-cols-2">

                {[

                  ["On-chain policy enforcement", "Organization-level controls and transaction limits."],

                  ["Transaction verification", "Backend transaction records are verified against on-chain activity."],

                  ["Cross-chain validation", "Source, destination, payload, operation and replay protections."],

                  ["Incident readiness", "Threat operations and incident-response procedures documented."],

                ].map(([title, text]) => (

                  <div key={title} className="border-t border-white/10 pt-5">

                    <h3 className="text-sm font-medium">{title}</h3>

                    <p className="mt-2 text-sm leading-6 text-white/40">

                      {text}

                    </p>

                  </div>

                ))}

              </div>

              <div className="mt-12 rounded-2xl border border-white/10 p-6">

                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">

                  Security status

                </p>

                <p className="mt-4 text-sm leading-6 text-white/50">

                  TokenvaPay is currently being prepared for controlled

                  design-partner pilots. Independent security review and

                  production readiness remain required before unrestricted

                  customer funds are accepted.

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section id="design-partners" className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-white/35">07 / Design partners</p>

            </div>

            <div>

              <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                Help shape the payment layer for global teams.

              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">

                TokenvaPay is being prepared for a small number of controlled

                design-partner pilots. We are building with teams that want

                programmable payroll, treasury, and payment infrastructure.

              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">

                <Link href={accessHref} className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90">
                {authenticated ? "Dashboard" : "Explore TokenvaPay"}
              </Link>

                <Link href="https\://tokenva-web.vercel.app" target="\_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white">

                  Visit Tokenva

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section>

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">

          <div className="rounded-3xl border border-white/10 p-8 sm:p-12 lg:p-16">

            <p className="text-xs uppercase tracking-[0.25em] text-white/35">

              08 / Get started

            </p>

            <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl">

                  Programmable payment infrastructure for global teams.

                </h2>

                <p className="mt-6 max-w-2xl text-sm leading-6 text-white/45">

                  Start with your TokenvaPay workspace and explore programmable

                  payroll, treasury, payment streams, and settlement.

                </p>

              </div>

              <Link
              href={accessHref}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              {accessLabel}
            </Link>

            </div>

          </div>

          <footer className="mt-20 border-t border-white/10 pt-12">

            <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

              <div>

                <Link href="/" className="text-lg font-semibold tracking-[-0.03em] text-white">TokenvaPay</Link>

                <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">

                  Programmable payment infrastructure for global teams.

                </p>

                <p className="mt-6 text-xs leading-5 text-white/30">

                  TokenvaPay is a product of{" "}

                  <Link href="https\://tokenva-web.vercel.app" target="\_blank" rel="noreferrer" className="text-white/50 transition hover:text-white">

                    Tokenva

                  </Link>.

                </p>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Product</p>

                <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">

                  <Link href="#product" className="transition hover:text-white">Product</Link>

                  <Link href="#how-it-works" className="transition hover:text-white">How it works</Link>

                  <Link href="#technology" className="transition hover:text-white">Technology</Link>

                  <Link href="#security" className="transition hover:text-white">Security</Link>

                </div>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Company</p>

                <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">

                  <Link href="https\://tokenva-web.vercel.app" target="\_blank" rel="noreferrer" className="transition hover:text-white">Tokenva</Link>

                  <Link href="#design-partners" className="transition hover:text-white">Design partners</Link>

                  <Link href={accessHref} className="transition hover:text-white">{accessLabel}</Link>

                </div>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Access</p>

                <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">

                  <Link href={accessHref} className="transition hover:text-white">{accessLabel}</Link>

                  <Link href="/app" className="transition hover:text-white">TokenvaPay workspace</Link>

                </div>

              </div>

            </div>

            <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">

              <span>© 2026 Tokenva. All rights reserved.</span>

              <span>TokenvaPay — programmable payment infrastructure.</span>

            </div>

          </footer>

        </div>

      </section>

    </main>

  );

}
