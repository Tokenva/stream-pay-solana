"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const capabilities = [
  {
    number: "01",
    title: "Programmable payment streams",
    text: "Define recurring payment flows instead of manually initiating every individual transfer.",
    visual: "stream",
  },
  {
    number: "02",
    title: "Stablecoin infrastructure",
    text: "Designed around digital-dollar payment workflows for internationally distributed teams.",
    visual: "coin",
  },
  {
    number: "03",
    title: "Cross-chain workflows",
    text: "Coordinate payment operations across supported blockchain environments.",
    visual: "chain",
  },
  {
    number: "04",
    title: "Transparent settlement",
    text: "On-chain activity provides a verifiable settlement layer for clearer reconciliation.",
    visual: "ledger",
  },
];

const steps = [
  { number: "01", title: "Fund", text: "The company funds the payment environment with supported assets." },
  { number: "02", title: "Create", text: "The company defines the recipient and programmable payment stream." },
  { number: "03", title: "Claim", text: "Employees or contractors claim available payments according to the configured stream." },
  { number: "04", title: "Reconcile", text: "Operations teams can track payment activity and settlement history." },
];

const ticker = [
  "PROGRAMMABLE STREAMS",
  "STABLECOIN PAYROLL",
  "SOLANA · DEVNET",
  "EVM · TESTNET",
  "CROSS-CHAIN SETTLEMENT",
  "ON-CHAIN RECONCILIATION",
  "POLICY ENFORCEMENT",
  "VERIFIABLE PAYMENTS",
];

/* ═══════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════ */

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCounter(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const { ref, visible } = useReveal(0.3);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const total = Math.round(duration / 16);
    const tick = () => {
      frame++;
      const progress = Math.min(frame / total, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);

  return { ref, value };
}

/* ═══════════════════════════════════════════════
   DECORATIVE
   ═══════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-overlay"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
      }}
    />
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 900ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 900ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO BACKGROUND
   ═══════════════════════════════════════════════ */

function HeroBackground({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <>
      {/* Mouse-follow ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(143,245,170,0.06), transparent 40%)`,
        }}
        aria-hidden="true"
      />

      {/* Perspective grid */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="gridMask" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="gridMaskId">
            <rect width="1440" height="900" fill="url(#gridMask)" />
          </mask>
        </defs>

        <g mask="url(#gridMaskId)">
          {Array.from({ length: 28 }).map((_, i) => {
            const y = 80 + i * 32;
            return (
              <line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2="1440"
                y2={y}
                stroke="url(#lineFade)"
                strokeWidth="0.5"
              />
            );
          })}

          {Array.from({ length: 44 }).map((_, i) => {
            const x = 60 + i * 32;
            const vanishX = 720;
            const offset = (x - vanishX) * 0.22;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1="80"
                x2={x + offset}
                y2="900"
                stroke="url(#lineFade)"
                strokeWidth="0.5"
                opacity="0.6"
              />
            );
          })}
        </g>
      </svg>

      {/* Orbital rings */}
      <svg
        className="pointer-events-none absolute right-[-200px] top-[-160px] h-[900px] w-[900px] opacity-[0.16] lg:right-[-120px] lg:h-[1000px] lg:w-[1000px]"
        viewBox="0 0 800 800"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="white" stopOpacity="0" />
            <stop offset="85%" stopColor="#8ff5aa" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="400" cy="400" r="140" stroke="white" strokeWidth="0.5" opacity="0.28" />
        <circle cx="400" cy="400" r="220" stroke="white" strokeWidth="0.5" opacity="0.2" />
        <circle cx="400" cy="400" r="300" stroke="white" strokeWidth="0.5" opacity="0.13" />
        <circle cx="400" cy="400" r="380" stroke="white" strokeWidth="0.4" opacity="0.08" />

        <circle
          cx="400"
          cy="400"
          r="260"
          stroke="#8ff5aa"
          strokeWidth="0.6"
          strokeDasharray="4 14"
          opacity="0.28"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 400 400"
            to="360 400 400"
            dur="60s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx="400"
          cy="400"
          r="340"
          stroke="white"
          strokeWidth="0.4"
          strokeDasharray="2 18"
          opacity="0.15"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 400 400"
            to="0 400 400"
            dur="90s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx="660" cy="400" r="3" fill="#8ff5aa" opacity="0.7" />
        <circle cx="400" cy="140" r="2" fill="white" opacity="0.4" />
        <circle cx="140" cy="400" r="2" fill="white" opacity="0.35" />
        <circle cx="400" cy="660" r="1.5" fill="white" opacity="0.25" />

        <circle cx="400" cy="400" r="400" fill="url(#orbGlow)" />
      </svg>

      {/* Base radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(143,245,170,0.045), transparent 60%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}

/* ═══════════════════════════════════════════════
   HERO DASHBOARD MOCKUP
   ═══════════════════════════════════════════════ */

function HeroDashboard() {
  const rows = [
    { name: "Maya Chen", role: "Engineering", amount: "2,400.00", status: "Streaming" },
    { name: "Luis Ortega", role: "Design", amount: "1,850.00", status: "Claimed" },
    { name: "Priya Raman", role: "Ops", amount: "2,120.00", status: "Streaming" },
    { name: "Sam Oduya", role: "Growth", amount: "1,960.00", status: "Pending" },
  ];

  const statusColor = (s: string) =>
    s === "Claimed" ? "#8ff5aa" : s === "Streaming" ? "#dfffe7" : "#8a8a8a";

  return (
    <div className="relative">
      {/* Glow behind */}
      <div
        className="absolute -inset-8 -z-10 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(143,245,170,0.12), transparent 65%)",
        }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e0e0e] to-[#070707] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {/* Top chrome */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <span className="ml-2 font-mono text-[11px] text-white/35">
              app.tokenvapay.io
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                style={{ background: "#8ff5aa" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "#8ff5aa" }}
              />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Live
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="border-b border-white/8 px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                Treasury balance
              </p>
              <p className="mt-2 font-mono text-3xl font-medium tracking-[-0.03em]">
                $248,320
                <span className="ml-2 text-base text-white/25">.00</span>
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
              style={{
                borderColor: "rgba(143,245,170,0.25)",
                background: "rgba(143,245,170,0.06)",
                color: "#8ff5aa",
              }}
            >
              <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                <path d="M2 8l3-3 2 2 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              +12.4%
            </div>
          </div>

          {/* Sparkline */}
          <svg className="mt-5 h-16 w-full" viewBox="0 0 400 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8ff5aa" stopOpacity="1" />
                <stop offset="100%" stopColor="#dfffe7" stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              d="M0,52 C40,48 60,32 90,36 C120,40 140,22 170,24 C200,26 220,14 250,18 C280,22 300,8 330,12 C360,16 380,6 400,8 L400,64 L0,64 Z"
              fill="url(#sparkGrad)"
            />
            <path
              d="M0,52 C40,48 60,32 90,36 C120,40 140,22 170,24 C200,26 220,14 250,18 C280,22 300,8 330,12 C360,16 380,6 400,8"
              fill="none"
              stroke="url(#sparkLine)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="400" cy="8" r="3" fill="#8ff5aa" />
            <circle cx="400" cy="8" r="6" fill="#8ff5aa" opacity="0.25">
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Recipients */}
        <div className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
              Active streams
            </p>
            <span className="font-mono text-[10px] text-white/25">4 recipients</span>
          </div>

          <div className="space-y-2.5">
            {rows.map((r, i) => (
              <div
                key={r.name}
                className="group/row flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2.5 transition hover:border-white/12 hover:bg-white/[0.03]"
                style={{
                  animation: `fadeSlide 700ms cubic-bezier(0.16,1,0.3,1) ${400 + i * 120}ms both`,
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 font-mono text-[10px] font-medium text-white/60"
                  style={{ background: "linear-gradient(135deg,#1a1a1a,#0e0e0e)" }}
                >
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/85">{r.name}</p>
                  <p className="truncate text-[10px] text-white/35">{r.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-medium text-white/80">
                    ${r.amount}
                  </p>
                  <p
                    className="mt-0.5 text-[9px] font-medium uppercase tracking-wider"
                    style={{ color: statusColor(r.status) }}
                  >
                    {r.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-white/8 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {["#8ff5aa", "#dfffe7", "#b5b5b5"].map((c, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border border-[#0a0a0a]"
                  style={{ background: c, opacity: 0.6 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-white/35">3 chains connected</span>
          </div>
          <span className="font-mono text-[10px] text-white/25">
            Slot 284,912,384
          </span>
        </div>

        {/* Shine sweep */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.035) 50%, transparent 60%)",
            animation: "shineSweep 8s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════════ */

function Marquee() {
  const items = [...ticker, ...ticker];
  return (
    <div className="relative overflow-hidden border-y border-white/8 bg-black py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent" />

      <div className="flex w-max" style={{ animation: "scrollX 40s linear infinite" }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-6 px-6">
            <span className="font-mono text-[11px] tracking-[0.2em] text-white/30">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STATS BAND
   ═══════════════════════════════════════════════ */

function StatItem({
  target,
  suffix,
  prefix,
  label,
  decimals = 0,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}) {
  const { ref, value } = useCounter(target);
  return (
    <div ref={ref} className="group relative">
      <p className="font-mono text-4xl font-medium tracking-[-0.04em] text-white/90 sm:text-5xl">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <div className="mt-4 h-px w-10 bg-white/15 transition-all duration-700 group-hover:w-20 group-hover:bg-[#8ff5aa]/40" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROBLEM SECTION VISUAL
   ═══════════════════════════════════════════════ */

function ChaosVisual() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="chaosGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8585" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ff8585" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="200" fill="url(#chaosGlow)" />

      {/* Chaotic tangled lines */}
      {[
        "M 40 40 Q 120 20 180 100 T 360 60",
        "M 60 160 Q 140 100 220 130 T 340 90",
        "M 30 90 Q 100 140 180 60 T 380 140",
        "M 80 30 Q 160 90 240 40 T 370 180",
        "M 20 130 Q 100 40 200 150 T 360 40",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#ff8585"
          strokeWidth="1"
          fill="none"
          opacity={0.35}
          strokeDasharray="3 3"
        />
      ))}

      {/* Nodes */}
      {[
        [40, 40], [180, 100], [360, 60], [60, 160], [220, 130],
        [340, 90], [30, 90], [180, 60], [380, 140], [80, 30],
        [240, 40], [370, 180], [20, 130], [200, 150], [360, 40],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="3"
          fill="#050505"
          stroke="#ff8585"
          strokeWidth="1"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}

function ClarityVisual() {
  const points = [40, 180, 320, 420];
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="clarityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="clarityLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#8ff5aa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#dfffe7" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="400" height="200" fill="url(#clarityGlow)" />

      <line
        x1="40"
        y1="100"
        x2="320"
        y2="100"
        stroke="url(#clarityLine)"
        strokeWidth="1.5"
      >
        <animate
          attributeName="stroke-dasharray"
          from="0 400"
          to="400 0"
          dur="2s"
          fill="freeze"
          begin="0.3s"
        />
      </line>

      {points.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="100" r="8" fill="#050505" stroke="#8ff5aa" strokeWidth="1" />
          <circle cx={x} cy="100" r="3" fill="#8ff5aa" />
          <circle cx={x} cy="100" r="3" fill="none" stroke="#8ff5aa" strokeWidth="1">
            <animate
              attributeName="r"
              values="3;14;3"
              dur="2s"
              begin={`${i * 0.4}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;0;0.5"
              dur="2s"
              begin={`${i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Checkmarks */}
      <g transform="translate(360, 90)">
        <circle r="9" fill="#8ff5aa" fillOpacity="0.12" stroke="#8ff5aa" strokeWidth="1" />
        <path
          d="M -4 0 L -1 3 L 4 -3"
          stroke="#8ff5aa"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   CAPABILITY MINI VISUALS
   ═══════════════════════════════════════════════ */

function CapabilityVisual({ kind }: { kind: string }) {
  if (kind === "stream") {
    return (
      <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
        <defs>
          <linearGradient id="streamG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0" />
            <stop offset="50%" stopColor="#8ff5aa" stopOpacity="1" />
            <stop offset="100%" stopColor="#dfffe7" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(0, ${12 + i * 12})`}>
            <line x1="0" y1="0" x2="120" y2="0" stroke="white" strokeOpacity="0.05" />
            <circle r="2.5" fill="#8ff5aa">
              <animate
                attributeName="cx"
                values="0;120"
                dur={`${3 + i * 0.4}s`}
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    );
  }

  if (kind === "coin") {
    return (
      <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
        <g transform="translate(60, 30)">
          {[24, 18, 12].map((r, i) => (
            <ellipse
              key={i}
              cx="0"
              cy={i * 3 - 3}
              rx={r}
              ry={r * 0.32}
              stroke="#8ff5aa"
              strokeWidth="0.8"
              fill={i === 0 ? "rgba(143,245,170,0.08)" : "none"}
              opacity={1 - i * 0.25}
            />
          ))}
          <text
            x="0"
            y="-12"
            textAnchor="middle"
            fill="#8ff5aa"
            fontSize="9"
            fontFamily="monospace"
            opacity="0.7"
          >
            $
          </text>
        </g>
      </svg>
    );
  }

  if (kind === "chain") {
    return (
      <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
        <g>
          {[20, 60, 100].map((x, i) => (
            <g key={i}>
              <rect
                x={x - 10}
                y="20"
                width="20"
                height="20"
                rx="6"
                stroke="#8ff5aa"
                strokeWidth="0.8"
                fill="rgba(143,245,170,0.05)"
                opacity={0.5 + i * 0.25}
              />
              <circle cx={x} cy="30" r="2.5" fill="#8ff5aa" opacity={0.5 + i * 0.25} />
            </g>
          ))}
          <line x1="30" y1="30" x2="50" y2="30" stroke="#8ff5aa" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2" />
          <line x1="70" y1="30" x2="90" y2="30" stroke="#8ff5aa" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2" />
          <circle r="2" fill="#dfffe7">
            <animate attributeName="cx" values="30;90" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="30;30" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(10, ${10 + i * 11})`}>
          <rect width="6" height="6" rx="1" fill="#8ff5aa" opacity={0.5 - i * 0.1} />
          <rect x="12" y="1.5" width={50 + i * 8} height="3" rx="1.5" fill="white" fillOpacity="0.08" />
          <rect x={68 + i * 8} y="1.5" width="30" height="3" rx="1.5" fill="#8ff5aa" fillOpacity={0.3 - i * 0.05} />
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   PAYMENT FLOW DIAGRAM (animated)
   ═══════════════════════════════════════════════ */

function PaymentFlowDiagram() {
  const nodes = [
    { x: 100, label: "Company", sub: "Funds treasury" },
    { x: 400, label: "Stream", sub: "Programmable" },
    { x: 700, label: "Employee", sub: "Claims payment" },
    { x: 1000, label: "Settlement", sub: "Track & reconcile" },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0b0b0b] to-[#060606] p-8 lg:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
            Payment flow
          </p>
          <h3 className="mt-1.5 text-lg font-medium">Programmable payroll stream</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/8 px-3 py-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "#8ff5aa",
              boxShadow: "0 0 8px #8ff5aa",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span className="font-mono text-[10px] tracking-wider text-white/50">
            ACTIVE
          </span>
        </div>
      </div>

      <svg viewBox="0 0 1100 180" className="h-44 w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0" />
            <stop offset="15%" stopColor="#8ff5aa" stopOpacity="0.6" />
            <stop offset="85%" stopColor="#8ff5aa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#dfffe7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nodeHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connector line */}
        <line
          x1="100"
          y1="90"
          x2="1000"
          y2="90"
          stroke="url(#flowLine)"
          strokeWidth="1.5"
          strokeDasharray="2 4"
        />

        {/* Animated pulse traveling */}
        <circle r="4" fill="#dfffe7">
          <animate attributeName="cx" values="100;1000" dur="4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="90;90" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle r="10" fill="#8ff5aa" opacity="0.3">
          <animate attributeName="cx" values="100;1000" dur="4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="90;90" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0.5;0" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy="90" r="40" fill="url(#nodeHalo)" />
            <circle
              cx={n.x}
              cy="90"
              r="22"
              fill="#0a0a0a"
              stroke="#8ff5aa"
              strokeWidth="1"
              strokeOpacity="0.35"
            />
            <circle cx={n.x} cy="90" r="4" fill="#8ff5aa" />

            <text
              x={n.x}
              y="140"
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="500"
              opacity="0.85"
            >
              {n.label}
            </text>
            <text
              x={n.x}
              y="158"
              textAnchor="middle"
              fill="#8a8a8a"
              fontSize="10"
            >
              {n.sub}
            </text>

            <text
              x={n.x}
              y="55"
              textAnchor="middle"
              fill="#8a8a8a"
              fontFamily="monospace"
              fontSize="10"
            >
              0{i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TECH VISUAL (orb)
   ═══════════════════════════════════════════════ */

function TechOrbVisual({ variant }: { variant: number }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`techGrad-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="80" fill={`url(#techGrad-${variant})`} />
      <circle cx="100" cy="100" r="70" stroke="#8ff5aa" strokeWidth="0.5" opacity="0.2" />
      <circle cx="100" cy="100" r="48" stroke="white" strokeWidth="0.5" opacity="0.12" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="26" stroke="white" strokeWidth="0.5" opacity="0.1" />

      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="26"
        stroke="#8ff5aa"
        strokeWidth="0.6"
        opacity="0.3"
        transform={`rotate(${variant * 30} 100 100)`}
      />
      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="26"
        stroke="#8ff5aa"
        strokeWidth="0.4"
        opacity="0.15"
        transform={`rotate(${-variant * 30} 100 100)`}
      />

      <circle cx="100" cy="100" r="3" fill="#8ff5aa" />

      {/* Orbit dot */}
      <circle r="2" fill="#dfffe7" opacity="0.8">
        <animateMotion
          dur={`${5 + variant}s`}
          repeatCount="indefinite"
          path="M 170 100 A 70 70 0 1 1 30 100 A 70 70 0 1 1 170 100"
        />
      </circle>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   SECURITY SHIELD
   ═══════════════════════════════════════════════ */

function SecurityShield() {
  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="150" r="140" fill="url(#shieldGlow)" />

      {/* Rotating outer ring */}
      <circle
        cx="150"
        cy="150"
        r="120"
        stroke="#8ff5aa"
        strokeWidth="0.5"
        fill="none"
        opacity="0.25"
        strokeDasharray="3 8"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 150 150"
          to="360 150 150"
          dur="40s"
          repeatCount="indefinite"
        />
      </circle>

      <circle
        cx="150"
        cy="150"
        r="90"
        stroke="white"
        strokeWidth="0.4"
        fill="none"
        opacity="0.15"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="360 150 150"
          to="0 150 150"
          dur="30s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Shield */}
      <path
        d="M 150 55 L 215 85 L 215 140 C 215 190 180 220 150 235 C 120 220 85 190 85 140 L 85 85 Z"
        fill="rgba(143,245,170,0.05)"
        stroke="#8ff5aa"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Checkmark */}
      <path
        d="M 120 145 L 142 167 L 185 122"
        stroke="#8ff5aa"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dasharray"
          from="0 200"
          to="200 0"
          dur="1.5s"
          fill="freeze"
          begin="0.5s"
        />
      </path>

      {/* Corner ticks */}
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="150"
          y1="20"
          x2="150"
          y2="30"
          stroke="#8ff5aa"
          strokeWidth="1"
          opacity="0.5"
          transform={`rotate(${deg} 150 150)`}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */

const NAV_SECTIONS = [
  ["#product", "Product"],
  ["#how-it-works", "How it works"],
  ["#technology", "Technology"],
  ["#security", "Security"],
  ["#design-partners", "Design partners"],
] as const;

export default function LandingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    void getSession().then((session) => {
      if (active) setAuthenticated(Boolean(session?.authenticated));
    });
    return () => {
      active = false;
    };
  }, []);

  // Scroll-spy: highlight the nav item for the section in view
  useEffect(() => {
    const ids = NAV_SECTIONS.map(([href]) => href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the topmost intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible.length > 0) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      {
        // Offset for fixed nav (~64px) + some lead-in
        rootMargin: "-80px 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      }
    );

    elements.forEach((el) => observer.observe(el));

    // Sync with initial hash if present
    if (typeof window !== "undefined" && window.location.hash) {
      setActiveSection(window.location.hash);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const accessHref = authenticated ? "/app" : "/login";
  const accessLabel = authenticated ? "Dashboard" : "Get started";

  return (
    <main className="relative min-h-screen scroll-smooth overflow-x-clip bg-black text-white">
      <GrainOverlay />

      {/* ═══════════════ NAV ═══════════════ */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-black/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inset-0 rounded-md border border-[#8ff5aa]/30" />
                <span className="absolute inset-0 rounded-md border border-[#8ff5aa]/15" style={{ transform: "rotate(45deg)" }} />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#8ff5aa]" />
              </span>
              <span className="text-lg font-semibold tracking-[-0.03em]">TokenvaPay</span>
            </Link>

            <div className="hidden items-center gap-8 text-sm md:flex">
              {NAV_SECTIONS.map(([href, label]) => {
                const isActive = activeSection === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setActiveSection(href)}
                    className={`relative transition ${
                      isActive
                        ? "text-white"
                        : "text-white/45 hover:text-white/85"
                    }`}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-1 left-0 h-px w-full origin-left transition-transform duration-300 ${
                        isActive
                          ? "scale-x-100 bg-[#8ff5aa]"
                          : "scale-x-0 bg-white/40"
                      }`}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {!authenticated && (
                <Link
                  href="/login"
                  className="hidden rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-white/25 hover:bg-white/5 hover:text-white sm:inline-flex md:hidden"
                >
                  Login
                </Link>
              )}

              <Link
                href={accessHref}
                className="group relative inline-flex items-center overflow-hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
              >
                <span className="relative z-10">{accessLabel}</span>
                <svg className="relative z-10 ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 6h8M7 3l3 3-3 3" />
                </svg>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>

              <details className="relative md:hidden">
                <summary
                  className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/12 text-white/60 transition hover:border-white/25 hover:text-white [&::-webkit-details-marker]:hidden"
                  aria-label="Open menu"
                >
                  <span className="sr-only">Open menu</span>
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-px w-4 bg-current" />
                    <span className="block h-px w-4 bg-current" />
                  </span>
                </summary>

                <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/8 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-2xl">
                  {NAV_SECTIONS.map(([href, label]) => {
                    const isActive = activeSection === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setActiveSection(href)}
                        className={`block rounded-xl px-4 py-3 text-sm transition ${
                          isActive
                            ? "bg-white/5 text-white"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                  <div className="my-2 border-t border-white/8" />
                  <Link
                    href={authenticated ? "/app" : "/login"}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
                  >
                    {authenticated ? "Dashboard" : "Login"}
                  </Link>
                </div>
              </details>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden border-b border-white/8"
      >
        <HeroBackground mouse={mouse} />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
            {/* Left */}
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 backdrop-blur"
                style={{ animation: "fadeSlide 800ms cubic-bezier(0.16,1,0.3,1) both" }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#8ff5aa" }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#8ff5aa" }} />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
                  Now in design-partner pilots
                </span>
              </div>

              <h1
                className="mt-8 text-5xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-[5.5rem]"
                style={{ animation: "fadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 100ms both" }}
              >
                Payments built for
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-white via-[#dfffe7] to-white/40 bg-clip-text text-transparent">
                    global teams.
                  </span>
                  <svg className="absolute -bottom-3 left-0 h-3 w-full" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
                    <path d="M2 6 Q 100 2 200 6 T 398 6" stroke="#8ff5aa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </span>
              </h1>

              <p
                className="mt-9 max-w-xl text-lg leading-8 text-white/45"
                style={{ animation: "fadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 200ms both" }}
              >
                Programmable payment infrastructure for distributed teams —
                recurring stablecoin streams, transparent settlement, and
                cross-chain workflows.
              </p>

              <div
                className="mt-10 flex flex-col gap-3 sm:flex-row"
                style={{ animation: "fadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 300ms both" }}
              >
                <Link
                  href={accessHref}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  <span className="relative z-10">{accessLabel}</span>
                  <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>

                <Link
                  href="#product"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-white/65 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition group-hover:bg-[#8ff5aa]" />
                  Explore platform
                </Link>
              </div>

              {/* Trust row */}
              <div
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/30"
                style={{ animation: "fadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 400ms both" }}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M6 1l5 2.5v3.5c0 2.5-2 4.5-5 4.5s-5-2-5-4.5V3.5L6 1z" />
                  </svg>
                  Policy enforced
                </span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8ff5aa] opacity-60" />
                  Solana + EVM
                </span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  Verifiable settlement
                </span>
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div
              className="relative lg:pl-4"
              style={{ animation: "fadeSlide 1100ms cubic-bezier(0.16,1,0.3,1) 300ms both" }}
            >
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <Marquee />

      {/* ═══════════════ STATS BAND ═══════════════ */}
      <section className="relative border-b border-white/8 bg-black">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <Reveal>
            <p className="mb-10 text-[11px] font-medium uppercase tracking-[0.25em] text-white/30">
              By the numbers
            </p>
          </Reveal>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={0}>
              <StatItem target={248} prefix="$" suffix="K" label="Avg. monthly streamed" />
            </Reveal>
            <Reveal delay={100}>
              <StatItem target={99.9} suffix="%" decimals={1} label="Uptime target" />
            </Reveal>
            <Reveal delay={200}>
              <StatItem target={3} label="Chains supported" />
            </Reveal>
            <Reveal delay={300}>
              <StatItem target={12} suffix="s" label="Avg. claim latency" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM ═══════════════ */}
      <section id="product" className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              01 / The problem
            </p>
          </Reveal>

          <div className="mt-10 grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:items-center">
            <Reveal>
              <h2 className="text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Global payments are still
                <br className="hidden sm:block" />{" "}
                <span className="text-white/40">too manual.</span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/40">
                Distributed companies rely on wallets, spreadsheets, manual
                transfers, and disconnected records to pay international teams.
                TokenvaPay turns that fragmented process into a programmable
                workflow.
              </p>

              <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] sm:grid-cols-3">
                {[
                  ["01", "Manual operations", "Repeated transfers and wallet management create unnecessary work."],
                  ["02", "Limited visibility", "Finance needs a clearer picture of what was funded, streamed, and settled."],
                  ["03", "Fragmented rails", "Teams operate across chains, assets, wallets, and environments."],
                ].map(([n, t, d]) => (
                  <div key={n} className="bg-black p-6 transition hover:bg-white/[0.015]">
                    <span className="font-mono text-[10px] text-white/25">{n}</span>
                    <h3 className="mt-8 text-sm font-medium">{t}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/35">{d}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Visual comparison */}
            <Reveal delay={150}>
              <div className="grid gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-[#ff8585]/12 bg-[#ff8585]/[0.02] p-1">
                  <div className="relative h-44 rounded-xl bg-black/60">
                    <ChaosVisual />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ff8585]/60" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff8585]/60">
                        Before · Manual
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center -my-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black">
                    <svg className="h-3 w-3 text-white/30" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M6 2v8M3 7l3 3 3-3" />
                    </svg>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[#8ff5aa]/20 bg-[#8ff5aa]/[0.02] p-1">
                  <div className="relative h-44 rounded-xl bg-black/60">
                    <ClarityVisual />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8ff5aa]" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#8ff5aa]/80">
                        After · Programmable
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ FLOW DIAGRAM ═══════════════ */}
      <section className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              02 / TokenvaPay
            </p>
          </Reveal>

          <div className="mt-10 grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <Reveal>
              <h2 className="text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                One programmable layer
                <br className="hidden sm:block" /> for recurring payments.
              </h2>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/40">
                TokenvaPay is payment infrastructure — not just another payroll
                dashboard. Every transfer is a programmable primitive.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  ["Treasury-first", "Fund a single workspace instead of juggling wallets."],
                  ["Stream-native", "Payments accrue per-second, claimable anytime."],
                  ["Chain-agnostic", "Coordinate operations across Solana and EVM."],
                ].map(([t, d]) => (
                  <div key={t} className="flex items-start gap-3.5 border-t border-white/8 pt-5">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#8ff5aa]/30 bg-[#8ff5aa]/5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8ff5aa]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{t}</p>
                      <p className="mt-1 text-xs leading-5 text-white/40">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150}>
              <PaymentFlowDiagram />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ CAPABILITIES ═══════════════ */}
      <section className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <Reveal>
            <div className="mb-12 flex items-end justify-between gap-6">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                03 / Capabilities
              </p>
              <p className="hidden max-w-sm text-xs leading-5 text-white/30 sm:block">
                Four core primitives powering the TokenvaPay stack.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item, i) => (
              <Reveal key={item.number} delay={i * 80}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0b0b0b] to-[#070707] p-7 transition-all duration-300 hover:border-white/15 lg:p-9">
                  {/* Visual anchor */}
                  <div className="mb-7 h-20 w-full">
                    <CapabilityVisual kind={item.visual} />
                  </div>

                  <span className="font-mono text-[10px] text-white/25">{item.number}</span>
                  <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/40">
                    {item.text}
                  </p>

                  <div className="absolute right-6 top-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <svg className="h-3.5 w-3.5 text-white/30" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M5 2h7v7M12 2L2 12" />
                    </svg>
                  </div>

                  {/* Hover glow */}
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(143,245,170,0.08), transparent 70%)",
                    }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <Reveal>
              <div className="lg:sticky lg:top-24">
                <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                  04 / How it works
                </p>
                <h2 className="mt-8 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                  Simple for the team.
                  <br />
                  <span className="text-white/40">Programmable underneath.</span>
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-6 text-white/40">
                  Four steps. The complexity lives in the infrastructure, not
                  in the workflow.
                </p>
              </div>
            </Reveal>

            <div className="relative">
              {/* Vertical connector */}
              <svg
                className="pointer-events-none absolute left-[19px] top-4 hidden h-[calc(100%-32px)] sm:block"
                width="2"
                preserveAspectRatio="none"
                viewBox="0 0 2 600"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0" />
                    <stop offset="15%" stopColor="#8ff5aa" stopOpacity="0.5" />
                    <stop offset="85%" stopColor="#8ff5aa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect width="2" height="600" fill="url(#timelineGrad)" />
              </svg>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <Reveal key={step.number} delay={i * 100}>
                    <div className="group relative flex gap-6 rounded-2xl border border-white/6 bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.025]">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                        <span className="absolute inset-0 rounded-full border border-white/10 bg-black transition-colors group-hover:border-[#8ff5aa]/40" />
                        <span className="relative font-mono text-[11px] font-medium text-white/50 transition-colors group-hover:text-[#8ff5aa]">
                          {step.number}
                        </span>
                      </div>
                      <div className="pt-1.5">
                        <h3 className="text-base font-medium">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-white/40">
                          {step.text}
                        </p>
                      </div>
                      <svg
                        className="absolute right-5 top-6 h-3 w-3 text-white/20 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      >
                        <path d="M2 6h8M7 3l3 3-3 3" />
                      </svg>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TECHNOLOGY ═══════════════ */}
      <section id="technology" className="relative overflow-hidden border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              05 / Technology
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-8 max-w-3xl text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Infrastructure for
              <br className="hidden sm:block" />{" "}
              <span className="text-white/40">programmable money.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Solana", text: "Core programmable payment infrastructure", status: "Devnet" },
              { title: "EVM", text: "Cross-chain gateway infrastructure", status: "Testnet" },
              { title: "Stablecoins", text: "Digital-dollar payment workflows", status: "Supported" },
              { title: "Messaging", text: "Coordinated multi-chain operations", status: "Testing" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0b0b0b] to-[#070707] p-6 transition-all duration-300 hover:border-white/15">
                  {/* Orb visual */}
                  <div className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.35] transition-opacity duration-500 group-hover:opacity-60">
                    <TechOrbVisual variant={i} />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium">{item.title}</h3>
                    </div>

                    <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 backdrop-blur">
                      {item.status}
                    </span>

                    <p className="mt-16 text-xs leading-5 text-white/40">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECURITY ═══════════════ */}
      <section id="security" className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:items-center">
            <Reveal>
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <SecurityShield />
              </div>
            </Reveal>

            <Reveal delay={150}>
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                06 / Security
              </p>

              <h2 className="mt-8 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                Built with security
                <br className="hidden sm:block" /> as a requirement.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/40">
                Explicit policy enforcement, transaction verification,
                cross-chain validation, cancellation controls, backend
                protections, and incident-response procedures.
              </p>

              <div className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  ["Policy enforcement", "Organization-level controls and limits."],
                  ["Transaction verification", "Backend records verified on-chain."],
                  ["Cross-chain validation", "Source, destination, and replay protections."],
                  ["Incident readiness", "Documented response procedures."],
                ].map(([t, d]) => (
                  <div key={t} className="group border-t border-white/8 pt-4 transition hover:border-white/20">
                    <div className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 text-[#8ff5aa]/70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M8 1l6 3v4c0 3.5-2.5 6.5-6 7-3.5-.5-6-3.5-6-7V4l6-3z" />
                        <path d="M6 8l1.5 1.5L10 6" />
                      </svg>
                      <h3 className="text-sm font-medium">{t}</h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-white/40">{d}</p>
                  </div>
                ))}
              </div>

              {/* Status card */}
              <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.015] p-6">
                <div
                  className="pointer-events-none absolute -left-16 -top-16 h-48 w-48"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(143,245,170,0.06), transparent 70%)",
                  }}
                />
                <div className="relative flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#8ff5aa]/25 bg-[#8ff5aa]/5">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="#8ff5aa" strokeWidth="1.4">
                      <path d="M6 1v10M3 4v4M9 4v4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8ff5aa]/80">
                      Status
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-white/50">
                      Prepared for controlled design-partner pilots. Independent
                      security review and production readiness remain required
                      before unrestricted customer funds are accepted.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ DESIGN PARTNERS ═══════════════ */}
      <section id="design-partners" className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:items-center">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                07 / Design partners
              </p>

              <h2 className="mt-8 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                Help shape the payment
                <br className="hidden sm:block" /> layer for global teams.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/40">
                TokenvaPay is being prepared for a small number of controlled
                design-partner pilots. We are building with teams that want
                programmable payroll, treasury, and payment infrastructure.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={accessHref}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  <span className="relative z-10">
                    {authenticated ? "Dashboard" : "Become a design partner"}
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>

                <Link
                  href="https://tokenva-web.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-white/60 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  Visit Tokenva
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <PartnerCard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(143,245,170,0.06), transparent 70%)",
          }}
        />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={`${i * 5}%`}
              x2="100%"
              y2={`${i * 5}%`}
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${i * 3.4}%`}
              y1="0"
              x2={`${i * 3.4}%`}
              y2="100%"
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-8 lg:py-40">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                08 / Get started
              </p>

              <h2 className="mt-8 text-5xl font-medium leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Programmable payments
                <br />
                <span className="bg-gradient-to-r from-white via-[#dfffe7] to-white/40 bg-clip-text text-transparent">
                  for global teams.
                </span>
              </h2>

              <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/40">
                Start with your TokenvaPay workspace and explore programmable
                payroll, treasury, payment streams, and settlement.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={accessHref}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  <span className="relative z-10">{accessLabel}</span>
                  <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-20 lg:px-8">
          <div className="grid gap-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inset-0 rounded-md border border-[#8ff5aa]/30" />
                  <span className="relative h-1 w-1 rounded-full bg-[#8ff5aa]" />
                </span>
                <span className="text-lg font-semibold tracking-[-0.03em]">TokenvaPay</span>
              </div>

              <p className="mt-5 max-w-xs text-sm leading-6 text-white/35">
                Programmable payment infrastructure for global teams.
              </p>

              <p className="mt-7 text-xs leading-5 text-white/25">
                A product of{" "}
                <Link
                  href="https://tokenva-web.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 underline decoration-white/15 underline-offset-2 transition hover:text-white"
                >
                  Tokenva
                </Link>
              </p>
            </div>

            {[
              {
                label: "Product",
                links: [
                  ["#product", "Product"],
                  ["#how-it-works", "How it works"],
                  ["#technology", "Technology"],
                  ["#security", "Security"],
                ],
              },
              {
                label: "Company",
                links: [
                  ["https://tokenva-web.vercel.app", "Tokenva"],
                  ["#design-partners", "Design partners"],
                  [accessHref, accessLabel],
                ],
              },
              {
                label: "Access",
                links: [
                  [accessHref, accessLabel],
                  ["/app", "TokenvaPay workspace"],
                ],
              },
            ].map((col) => (
              <div key={col.label}>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/25">
                  {col.label}
                </p>
                <div className="mt-5 flex flex-col gap-3.5 text-sm text-white/40">
                  {col.links.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      {...(href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="transition hover:text-white"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-3 border-t border-white/8 pt-7 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Tokenva. All rights reserved.</span>
            <span className="font-mono">
              TokenvaPay — programmable payment infrastructure.
            </span>
          </div>
        </div>
      </footer>

      {/* ═══════════════ GLOBAL STYLES ═══════════════ */}
      <style jsx global>{`
        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shineSweep {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        @keyframes scrollX {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        section[id] {
          scroll-margin-top: 80px;
        }

        ::selection {
          background: rgba(143, 245, 170, 0.25);
          color: white;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #242424;
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #383838;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ═══════════════════════════════════════════════
   PARTNER CARD (isolated for clarity)
   ═══════════════════════════════════════════════ */

function PartnerCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-[#0c0c0c] to-[#070707] p-8 lg:p-10">
      {/* Ambient */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72"
        style={{
          background:
            "radial-gradient(circle, rgba(143,245,170,0.07), transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {["#8ff5aa", "#dfffe7", "#b5b5b5", "#8a8a8a"].map((c, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full border border-[#0a0a0a]"
                  style={{ background: c, opacity: 0.7 - i * 0.12 }}
                />
              ))}
            </div>
            <span className="text-xs text-white/40">12 slots remaining</span>
          </div>

          <span className="rounded-full border border-[#8ff5aa]/20 bg-[#8ff5aa]/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8ff5aa]/80">
            Cohort 01
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {[
            ["Early access to workspace", true],
            ["Direct input on roadmap", true],
            ["Priority support & onboarding", true],
            ["Custom chain integrations", false],
          ].map(([label, done], i) => (
            <div key={i} className="flex items-center gap-3 border-b border-white/6 pb-3 last:border-0">
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-[#8ff5aa]/40 bg-[#8ff5aa]/10"
                    : "border-white/15"
                }`}
              >
                {done && (
                  <svg className="h-2 w-2" viewBox="0 0 8 8" fill="none" stroke="#8ff5aa" strokeWidth="1.6">
                    <path d="M1 4l2 2 4-4" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${done ? "text-white/70" : "text-white/35"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <span className="font-mono text-[10px] text-white/25">APPLY NOW</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>
      </div>
    </div>
  );
}