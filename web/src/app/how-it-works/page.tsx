"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const sections = [
  {
    number: "01",
    title: "Connect your wallet",
    description:
      "Your wallet is how you prove you control an account and approve blockchain actions. Connecting it does not give TokenvaPay your private keys or automatically approve payments.",
    steps: [
      "Open the TokenvaPay app and choose the wallet connection option on the login screen.",
      "Choose a supported Solana wallet and follow the wallet's prompts.",
      "If asked to sign a message to log in, read the request and approve it only if you started the login.",
      "Once you reach the app, check that the connected wallet address is the one you intended to use.",
      "Keep your recovery phrase and private key private. Never paste them into TokenvaPay or send them to support."
    ],
    note:
      "Logging in and approving a payment are different things. A payment or other on-chain action may ask for a separate wallet confirmation.",
    visual: "wallet" as const,
  },
  {
    number: "02",
    title: "Set up your company",
    description:
      "TokenvaPay organizes payroll around a company workspace. Before you make payments, make sure you are in the right company and that your account has the access it needs.",
    steps: [
      "Open the company setup or onboarding flow available to your account.",
      "Enter the company information requested by the app and review it before submitting.",
      "Complete any approval or setup steps the app displays. Some actions may remain unavailable until setup is complete.",
      "When the company workspace opens, check the company name and your role before continuing.",
      "If you work with more than one company, make sure you are using the workspace for the payroll you intend to manage."
    ],
    note:
      "The exact onboarding fields and approval process depend on the version and configuration of the app you are using. Follow the options actually shown on your screen.",
    visual: "company" as const,
  },
  {
    number: "03",
    title: "Prepare the treasury",
    description:
      "The treasury is the company's payment pool. It needs the right supported asset on the right network before payroll can be funded. Take a moment to verify the destination before moving money.",
    steps: [
      "Open the treasury area and review the configured network and supported token.",
      "Check the displayed vault or treasury address carefully. Compare it with the destination you intend to fund.",
      "Confirm that you have selected the correct network and asset in your wallet before sending anything.",
      "Review the amount, destination, and estimated network fee in your wallet.",
      "Approve the transfer only after checking the details, then wait for the transaction to confirm.",
      "Return to TokenvaPay and check the treasury balance and transaction status. If the balance has not updated, verify the transaction before trying again."
    ],
    note:
      "Blockchain transfers are generally irreversible. Never send an unsupported token or use a different network just because the address looks familiar. Keep enough of the network's native token for transaction fees where required.",
    visual: "treasury" as const,
  },
  {
    number: "04",
    title: "Add and check employees",
    description:
      "A payroll payment must point to the right recipient. Treat the employee's wallet address like bank account details: verify it before you create a payment.",
    steps: [
      "Open Employees and review the people already listed in the company workspace.",
      "Use the employee-add or invitation flow available in your dashboard to add a recipient.",
      "Confirm the employee's wallet address with them through a trusted, separate channel.",
      "Check that the employee is linked to the correct company and that the address has no missing or changed characters.",
      "Before creating payroll, review the recipient again alongside the amount and token."
    ],
    note:
      "A wallet address is the destination for an on-chain payment. A familiar name alone is not enough to verify a recipient. Only describe or use invitation features that are actually available in your current app.",
    visual: "employees" as const,
  },
  {
    number: "05",
    title: "Create a payroll stream",
    description:
      "A payment stream is a way to define compensation over a period instead of treating every payment as an unrelated transfer. The fields available in your dashboard determine exactly how a stream can be configured.",
    steps: [
      "Open Payroll and choose the stream-creation action if it is available to your role.",
      "Select the intended employee or enter the recipient details requested by the form.",
      "Enter the amount and timing details requested by the app. Check the units and dates rather than assuming they mean what another payroll system uses.",
      "Review the recipient, token, amount, schedule, and any displayed fees or conditions together before submitting.",
      "Submit the action and read the wallet transaction request. Approve it only when the details match what you intended.",
      "Wait for confirmation, then return to the dashboard and check the stream's status and details."
    ],
    note:
      "A wallet prompt means a transaction is being requested; it does not by itself mean the transaction succeeded. If the app shows a signature or transaction link, use it to check the result before retrying.",
    visual: "payroll" as const,
  },
  {
    number: "06",
    title: "Understand a payment stream",
    description:
      "Think of a stream as a set of payment rules: who receives the funds, which asset is used, and what timing or funding rules apply. The stream's actual behavior is determined by the deployed program and the details shown in the app.",
    steps: [
      "Open the stream and confirm the recipient, token, amount, and current status.",
      "Read any displayed start, end, duration, accrued, claimable, or balance information carefully. These values describe different things.",
      "Check whether the stream has enough funding for the payment arrangement; a stream's existence does not automatically mean it is fully funded.",
      "If an action such as claim, top up, or cancel is available, read its explanation and review the wallet request before approving it.",
      "After the action, wait for confirmation and check the stream again."
    ],
    note:
      "Accrued or claimable value is not necessarily the same as the amount already received in the employee's wallet. Available actions and their effects depend on the deployed program and the current app.",
    visual: "stream" as const,
  },
  {
    number: "07",
    title: "Know what your role allows",
    description:
      "Your role helps determine which parts of a company workspace you can use. If an action is missing or disabled, check your selected company and assigned access before assuming something is broken.",
    steps: [
      "Owner: check company-level setup and administrative controls available to the owner account.",
      "Admin: use the company-management and operational actions that are enabled for your account.",
      "Finance: review the treasury and financial actions that your workspace permits.",
      "Approver: review requests and approval actions only where an approval flow is configured.",
      "Viewer: review the company information made available through read-only access.",
      "Employee: use the employee-facing features available to review personal payroll or claim payments, where supported."
    ],
    note:
      "These labels explain the intended role categories; they do not guarantee that every action is implemented or enabled in every deployment. The permissions displayed by the app and enforced by the program are authoritative.",
    visual: "roles" as const,
  },
  {
    number: "08",
    title: "Check reports and activity",
    description:
      "Reports and activity help you understand what the app has recorded. For an important payment, distinguish between an action being requested, a transaction being confirmed on-chain, and the dashboard reflecting the update.",
    steps: [
      "Open Reports and review the payroll and stream information available to your account.",
      "Open Activity to investigate recent actions and look for a transaction signature or status when one is provided.",
      "For an important payment, check the transaction's confirmed result rather than relying only on a loading message or a dashboard total.",
      "If the dashboard appears behind, refresh or allow its data to update before drawing conclusions.",
      "Use export options only if they are present in your current dashboard, and reconcile important records against confirmed transactions."
    ],
    note:
      "The dashboard and any indexed reports may update after the blockchain transaction confirms. A pending or missing dashboard record does not by itself prove that a transaction failed.",
    visual: "reports" as const,
  },
];

const faqs = [
  {
    question: "I connected my wallet. Why can't I access the company dashboard?",
    answer:
      "First, check that you connected the intended wallet and selected the correct company workspace. Then check whether company onboarding or approval is still pending and whether your role allows the action you are trying to use. If access still looks wrong, note the screen and message you see rather than repeatedly reconnecting or submitting forms.",
  },
  {
    question: "Is connecting my wallet the same as approving a payment?",
    answer:
      "No. Connecting a wallet lets the app identify the wallet you are using. A blockchain action may request a separate signature or transaction approval. Read each wallet prompt carefully and approve only actions you recognize and intend to perform.",
  },
  {
    question: "What should I do if a transaction fails or stays pending?",
    answer:
      "Read the message shown by TokenvaPay and your wallet. If a transaction signature is available, check its status before trying again. Confirm the network, recipient, asset, amount, and available fee balance. Avoid submitting the same operation repeatedly until you know whether the earlier transaction confirmed.",
  },
  {
    question: "Why can't I create payroll even though the treasury has funds?",
    answer:
      "The displayed balance may be in the wrong asset or network, or some of the balance may not be available for the operation. Check the configured token, the amount required, transaction fees, the selected company, and your role permissions. Use only the funding destination and asset specified by the current app.",
  },
  {
    question: "Why hasn't my stream or report updated?",
    answer:
      "A transaction can take time to confirm, and dashboard or report data may update later. If you have a transaction signature, check its confirmed result first. Then refresh the app or allow the report to catch up. Do not assume the payment failed just because a dashboard number has not changed yet.",
  },
  {
    question: "Can I reverse a confirmed blockchain transaction?",
    answer:
      "Usually, a confirmed blockchain transaction cannot simply be undone. A protocol may provide a separate action to change or cancel a stream, but that is not the same as reversing the original transaction. Check the action's effects before signing, and verify the details before sending funds.",
  },
  {
    question: "What if I sent funds to the wrong address or on the wrong network?",
    answer:
      "Do not send another transfer in an attempt to fix it. Save the transaction signature and details, verify what happened using the relevant network's transaction record, and seek help from the wallet or platform support channels if available. Recovery may not be possible.",
  },
  {
    question: "Why is an action missing or disabled for me?",
    answer:
      "Check the selected company and your assigned role first. The action may also depend on company setup, available funds, stream status, or which features are enabled in the current deployment. If the reason is not clear, capture the exact message and contact the workspace administrator.",
  },
  {
    question: "Does TokenvaPay need my seed phrase or private key?",
    answer:
      "No. Never share your seed phrase or private key with TokenvaPay, a support agent, or anyone claiming to help. Wallet authentication and transaction approval should happen through your wallet's own interface.",
  },
];

/* ═══════════════════════════════════════════════
   SHARED
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

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
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
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCROLL PROGRESS BAR (top)
   ═══════════════════════════════════════════════ */

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      setProgress(scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] h-[2px] bg-white/[0.04]">
      <div
        className="h-full bg-gradient-to-r from-[#8ff5aa] to-[#dfffe7] transition-[width] duration-150"
        style={{
          width: `${progress * 100}%`,
          boxShadow: "0 0 12px rgba(143,245,170,0.5)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════ */

function HeroBackground({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(143,245,170,0.06), transparent 40%)`,
        }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="hwMask" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hwLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.07" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="hwMaskId">
            <rect width="1440" height="600" fill="url(#hwMask)" />
          </mask>
        </defs>
        <g mask="url(#hwMaskId)">
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={60 + i * 30} x2="1440" y2={60 + i * 30} stroke="url(#hwLine)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 44 }).map((_, i) => {
            const x = 40 + i * 32;
            const offset = (x - 720) * 0.22;
            return <line key={`v-${i}`} x1={x} y1="60" x2={x + offset} y2="600" stroke="url(#hwLine)" strokeWidth="0.5" opacity="0.5" />;
          })}
        </g>
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(143,245,170,0.045), transparent 60%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}

function HeroOrbit() {
  return (
    <svg
      className="pointer-events-none absolute right-[-120px] top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 opacity-[0.14] lg:block"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hwGlow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="white" stopOpacity="0" />
          <stop offset="90%" stopColor="#8ff5aa" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="180" fill="url(#hwGlow)" />
      <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="0.5" opacity="0.2" />
      <circle cx="200" cy="200" r="110" stroke="white" strokeWidth="0.5" opacity="0.15" />
      <circle cx="200" cy="200" r="70" stroke="white" strokeWidth="0.4" opacity="0.1" />

      <circle cx="200" cy="200" r="130" stroke="#8ff5aa" strokeWidth="0.6" strokeDasharray="4 14" opacity="0.35">
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="45s" repeatCount="indefinite" />
      </circle>

      {/* Numbered node markers around the ring (representing 8 steps) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = 130;
        const x = 200 + Math.cos(angle) * r;
        const y = 200 + Math.sin(angle) * r;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#050505" stroke="#8ff5aa" strokeWidth="0.7" opacity="0.8" />
            <circle cx={x} cy={y} r="1.5" fill="#8ff5aa" opacity="0.9" />
          </g>
        );
      })}

      <circle r="3" fill="#dfffe7">
        <animateMotion dur="16s" repeatCount="indefinite" path="M 330 200 A 130 130 0 1 1 70 200 A 130 130 0 1 1 330 200" />
      </circle>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   SECTION VISUAL ANCHORS
   ═══════════════════════════════════════════════ */

function SectionVisual({ kind }: { kind: string }) {
  if (kind === "wallet") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vWalletGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vWalletGlow)" />

        {/* Wallet body */}
        <rect x="55" y="30" width="90" height="55" rx="8" stroke="#8ff5aa" strokeWidth="0.8" strokeOpacity="0.5" fill="rgba(143,245,170,0.04)" />
        <rect x="110" y="45" width="42" height="25" rx="5" stroke="#8ff5aa" strokeWidth="0.7" strokeOpacity="0.7" fill="rgba(143,245,170,0.06)" />
        <circle cx="131" cy="57.5" r="3" fill="#8ff5aa" />
        <circle cx="131" cy="57.5" r="6" fill="#8ff5aa" opacity="0.25">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
        </circle>

        <text x="100" y="26" textAnchor="middle" fill="#8a8a8a" fontSize="7" fontFamily="monospace">
          CONNECT WALLET
        </text>
      </svg>
    );
  }

  if (kind === "company") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vCompanyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vCompanyGlow)" />

        {/* Building outline */}
        <rect x="70" y="35" width="60" height="50" rx="4" stroke="#8ff5aa" strokeWidth="0.8" strokeOpacity="0.5" fill="rgba(143,245,170,0.04)" />
        {/* Windows */}
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={78 + c * 13}
              y={43 + r * 13}
              width="6"
              height="6"
              rx="1"
              fill="#8ff5aa"
              opacity={0.15 + (r * 4 + c) * 0.06}
            />
          ))
        )}
        {/* Approval badge */}
        <circle cx="155" cy="35" r="9" fill="#050505" stroke="#8ff5aa" strokeWidth="0.8" />
        <path d="M 151 35 L 154 38 L 160 32" stroke="#8ff5aa" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "treasury") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vTreasGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vTreasGlow)" />

        {/* Vault */}
        <circle cx="100" cy="50" r="28" stroke="#8ff5aa" strokeWidth="0.8" strokeOpacity="0.5" fill="rgba(143,245,170,0.04)" />
        <circle cx="100" cy="50" r="22" stroke="#8ff5aa" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 4" />
        <circle cx="100" cy="50" r="5" fill="#8ff5aa" opacity="0.7" />

        {/* Lock marks */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="100"
            y1="22"
            x2="100"
            y2="30"
            stroke="#8ff5aa"
            strokeWidth="1"
            opacity="0.6"
            transform={`rotate(${deg} 100 50)`}
          />
        ))}

        <text x="100" y="92" textAnchor="middle" fill="#8a8a8a" fontSize="6" fontFamily="monospace">
          VAULT
        </text>
      </svg>
    );
  }

  if (kind === "employees") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vEmpGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vEmpGlow)" />

        {/* Person nodes */}
        {[55, 100, 145].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={i === 1 ? 35 : 45} r="8" stroke="#8ff5aa" strokeWidth="0.7" strokeOpacity={0.4 + i * 0.15} fill="rgba(143,245,170,0.05)" />
            <circle cx={x} cy={i === 1 ? 32 : 42} r="2.5" fill="#8ff5aa" opacity={0.5 + i * 0.2} />
            <path
              d={`M ${x - 4} ${i === 1 ? 40 : 50} q 4 -3 8 0`}
              stroke="#8ff5aa"
              strokeWidth="0.5"
              fill="none"
              opacity={0.5 + i * 0.15}
            />
          </g>
        ))}

        {/* Connector lines to top person */}
        <line x1="63" y1="45" x2="92" y2="35" stroke="#8ff5aa" strokeWidth="0.4" opacity="0.3" strokeDasharray="1 2" />
        <line x1="108" y1="35" x2="137" y2="45" stroke="#8ff5aa" strokeWidth="0.4" opacity="0.3" strokeDasharray="1 2" />

        <text x="100" y="75" textAnchor="middle" fill="#8a8a8a" fontSize="6" fontFamily="monospace">
          DIRECTORY
        </text>
      </svg>
    );
  }

  if (kind === "payroll") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vPayGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vPayLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#8ff5aa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vPayGlow)" />

        {/* Form fields */}
        <rect x="30" y="35" width="50" height="12" rx="3" stroke="#8ff5aa" strokeWidth="0.5" strokeOpacity="0.5" fill="rgba(143,245,170,0.03)" />
        <rect x="30" y="55" width="50" height="12" rx="3" stroke="#8ff5aa" strokeWidth="0.5" strokeOpacity="0.5" fill="rgba(143,245,170,0.03)" />

        {/* Arrow */}
        <line x1="85" y1="50" x2="115" y2="50" stroke="url(#vPayLine)" strokeWidth="0.8" strokeDasharray="2 3" />
        <circle r="2" fill="#dfffe7">
          <animate attributeName="cx" values="85;115" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;50" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Resulting stream */}
        <rect x="120" y="38" width="50" height="24" rx="4" stroke="#8ff5aa" strokeWidth="0.8" strokeOpacity="0.6" fill="rgba(143,245,170,0.05)" />
        <text x="145" y="53" textAnchor="middle" fill="#8ff5aa" fontSize="7" fontFamily="monospace">
          STREAM
        </text>
      </svg>
    );
  }

  if (kind === "stream") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="vStreamLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0" />
            <stop offset="50%" stopColor="#8ff5aa" stopOpacity="1" />
            <stop offset="100%" stopColor="#dfffe7" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="vStreamGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vStreamGlow)" />

        {/* Timeline */}
        <line x1="30" y1="50" x2="170" y2="50" stroke="url(#vStreamLine)" strokeWidth="1" />

        {/* Waypoints */}
        {[50, 90, 130, 160].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="50" r="4" fill="#050505" stroke="#8ff5aa" strokeWidth="0.7" />
            <circle cx={x} cy="50" r="1.5" fill="#8ff5aa" />
            <text x={x} y="68" textAnchor="middle" fill="#8a8a8a" fontSize="5" fontFamily="monospace">
              T{i}
            </text>
          </g>
        ))}

        {/* Animated value dot */}
        <circle r="2.5" fill="#dfffe7">
          <animate attributeName="cx" values="50;160" dur="3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;50" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  if (kind === "roles") {
    return (
      <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vRolesGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="50" r="45" fill="url(#vRolesGlow)" />

        {/* Role stack */}
        {[
          { label: "OWNER", w: 100, op: 0.8 },
          { label: "ADMIN", w: 85, op: 0.6 },
          { label: "FINANCE", w: 70, op: 0.45 },
          { label: "VIEWER", w: 55, op: 0.3 },
        ].map((r, i) => (
          <g key={r.label}>
            <rect
              x={100 - r.w / 2}
              y={22 + i * 14}
              width={r.w}
              height="10"
              rx="3"
              fill="#8ff5aa"
              fillOpacity={0.05 + r.op * 0.05}
              stroke="#8ff5aa"
              strokeOpacity={r.op}
              strokeWidth="0.6"
            />
            <text
              x="100"
              y={29.5 + i * 14}
              textAnchor="middle"
              fill="#8ff5aa"
              fontSize="5.5"
              fontFamily="monospace"
              opacity={0.6 + r.op * 0.4}
            >
              {r.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // reports
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vRepFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vRepLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#dfffe7" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="vRepGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8ff5aa" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8ff5aa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="50" r="45" fill="url(#vRepGlow)" />

      {/* Bars */}
      {[40, 55, 45, 65, 52, 70, 58].map((h, i) => (
        <rect
          key={i}
          x={30 + i * 20}
          y={70 - h}
          width="10"
          height={h}
          rx="2"
          fill="#8ff5aa"
          fillOpacity={0.1 + i * 0.03}
          stroke="#8ff5aa"
          strokeOpacity="0.35"
          strokeWidth="0.5"
        />
      ))}

      {/* Sparkline overlay */}
      <path
        d="M 35,40 C 55,35 70,45 90,40 C 110,35 130,30 155,28"
        stroke="url(#vRepLine)"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="155" cy="28" r="2" fill="#dfffe7" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   TABLE OF CONTENTS (sticky desktop rail)
   ═══════════════════════════════════════════════ */

function TableOfContents() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const ids = sections.map((s) => `section-${s.number}`);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-1">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          On this page
        </p>
        {sections.map((s) => {
          const isActive = active === `section-${s.number}`;
          return (
            <a
              key={s.number}
              href={`#section-${s.number}`}
              className={`group flex items-center gap-3 py-1.5 text-xs transition-colors ${
                isActive ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span
                className={`h-px transition-all duration-300 ${
                  isActive ? "w-6 bg-[#8ff5aa]" : "w-3 bg-white/20 group-hover:w-5 group-hover:bg-white/40"
                }`}
              />
              <span className="font-mono text-[10px] tracking-wider">{s.number}</span>
              <span className="truncate">{s.title}</span>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */

export default function HowItWorksPage() {
  const heroRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050505] text-[#f5f5f5]">
      <GrainOverlay />
      <ScrollProgress />

      {/* ───── NAV ───── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image src='/logo.svg' alt='logo' width='200' height='200' />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-white/25 hover:bg-white/5 hover:text-white sm:inline-flex"
              >
                Home
              </Link>
              <Link
                href="/app"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
              >
                <span className="relative z-10">Dashboard</span>
                <svg className="relative z-10 h-3 w-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden border-b border-white/8"
      >
        <HeroBackground mouse={mouse} />
        <HeroOrbit />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-28">
          <div
            className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 backdrop-blur"
            style={{ animation: "hwFadeSlide 800ms cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#8ff5aa" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#8ff5aa" }} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
              TokenvaPay documentation
            </span>
          </div>

          <h1
            className="mt-8 max-w-5xl text-5xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-[5rem]"
            style={{ animation: "hwFadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 100ms both" }}
          >
            From company setup to
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-white via-[#dfffe7] to-white/40 bg-clip-text text-transparent">
                programmable payroll.
              </span>
              <svg className="absolute -bottom-3 left-0 h-3 w-full" viewBox="0 0 700 12" fill="none" preserveAspectRatio="none">
                <path d="M2 6 Q 175 2 350 6 T 698 6" stroke="#8ff5aa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>

          <p
            className="mt-9 max-w-2xl text-lg leading-8 text-white/45"
            style={{ animation: "hwFadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 200ms both" }}
          >
            Learn how to navigate your workspace, configure the payment
            environment, manage employees, create payroll streams, understand
            permissions, and review financial activity.
          </p>

          <div
            className="mt-10 flex flex-col gap-3 sm:flex-row"
            style={{ animation: "hwFadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 300ms both" }}
          >
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              <span className="relative z-10">Open dashboard</span>
              <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>

            <a
              href="#workflow"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-white/65 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition group-hover:bg-[#8ff5aa]" />
              Explore the guide
            </a>
          </div>

          {/* Meta strip */}
          <div
            className="mt-16 grid gap-8 border-t border-white/8 pt-7 sm:grid-cols-3"
            style={{ animation: "hwFadeSlide 900ms cubic-bezier(0.16,1,0.3,1) 400ms both" }}
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Sections
              </p>
              <p className="mt-2 font-mono text-lg text-white/70">08</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Est. read time
              </p>
              <p className="mt-2 font-mono text-lg text-white/70">~12 min</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Last updated
              </p>
              <p className="mt-2 font-mono text-lg text-white/70">2026</p>
            </div> 
          </div>
        </div>
      </section>

      {/* ───── WORKFLOW ───── */}
      <section id="workflow" className="relative scroll-mt-24 border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
          <div className="grid gap-16 lg:grid-cols-[220px_1fr] lg:gap-20">
            {/* Sticky TOC */}
            <TableOfContents />

            <div>
              <Reveal>
                <div className="mb-14">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                    The complete workflow
                  </p>
                  <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                    How TokenvaPay works
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/40">
                    Follow these stages in order where applicable. Your available
                    actions depend on your role, company status, and configuration.
                  </p>
                </div>
              </Reveal>

              <div className="space-y-4">
                {sections.map((section, i) => (
                  <Reveal key={section.number} delay={i * 40}>
                    <article
                      id={`section-${section.number}`}
                      className="group relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0b0b0b] to-[#070707] p-6 transition-all duration-300 hover:border-white/15 sm:p-8 lg:p-10"
                    >
                      {/* Ambient corner glow on hover */}
                      <div
                        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(143,245,170,0.08), transparent 70%)",
                        }}
                      />

                      <div className="relative grid gap-8 lg:grid-cols-[1fr_280px]">
                        {/* Left: content */}
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] font-medium tracking-wider text-[#8ff5aa]/70">
                              {section.number}
                            </span>
                            <span className="h-px w-8 bg-[#8ff5aa]/30" />
                          </div>

                          <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] sm:text-2xl">
                            {section.title}
                          </h3>

                          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
                            {section.description}
                          </p>

                          <ol className="mt-7 space-y-3.5">
                            {section.steps.map((step, index) => (
                              <li
                                key={step}
                                className="flex gap-4 text-sm leading-6 text-white/70"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.02] font-mono text-[9px] text-[#8ff5aa]/80">
                                  {index + 1}
                                </span>
                                <span className="flex-1">{step}</span>
                              </li>
                            ))}
                          </ol>

                          {/* Note */}
                          <div className="mt-7 relative overflow-hidden rounded-xl border border-[#8ff5aa]/12 bg-[#8ff5aa]/[0.025] p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#8ff5aa]/30 bg-[#8ff5aa]/5">
                                <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="#8ff5aa" strokeWidth="1.4">
                                  <path d="M6 2v5M6 9.5v.5" strokeLinecap="round" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8ff5aa]/80">
                                  Important
                                </p>
                                <p className="mt-1.5 text-sm leading-6 text-white/50">
                                  {section.note}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: visual anchor */}
                        <div className="relative hidden lg:block">
                          <div className="sticky top-28 h-44 w-full opacity-90">
                            <SectionVisual kind={section.visual} />
                          </div>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
          <Reveal>
            <div className="grid gap-16 lg:grid-cols-[220px_1fr] lg:gap-20">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                  Help
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  Frequently asked
                  <br />
                  <span className="text-white/40">questions.</span>
                </h2>

                <div className="mt-12 divide-y divide-white/8 border-y border-white/8">
                  {faqs.map((faq, i) => (
                    <details key={faq.question} className="group py-6">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium text-white/85 transition hover:text-white sm:text-base">
                        <span className="flex items-center gap-4">
                          <span className="font-mono text-[10px] text-white/25">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {faq.question}
                        </span>
                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/12 transition-all duration-300 group-hover:border-[#8ff5aa]/40 group-open:border-[#8ff5aa]/60 group-open:bg-[#8ff5aa]/5">
                          <svg
                            className="h-3 w-3 text-white/50 transition-transform duration-300 group-open:rotate-45 group-open:text-[#8ff5aa]"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M6 2v8M2 6h8" strokeLinecap="round" />
                          </svg>
                        </span>
                      </summary>
                      <p className="mt-5 max-w-3xl pl-8 text-sm leading-7 text-white/45">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── CTA / FOOTER ───── */}
      <section className="relative overflow-hidden">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`bh-${i}`} x1="0" y1={`${i * 4.5}%`} x2="100%" y2={`${i * 4.5}%`} stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 32 }).map((_, i) => (
            <line key={`bv-${i}`} x1={`${i * 3.2}%`} y1="0" x2={`${i * 3.2}%`} y2="100%" stroke="white" strokeWidth="0.5" />
          ))}
        </svg>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(143,245,170,0.07), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Ready to begin
              </p>
              <h2 className="mt-8 text-4xl font-medium leading-[1.05] tracking-[-0.045em] sm:text-5xl">
                Return to your
                <br />
                <span className="bg-gradient-to-r from-white via-[#dfffe7] to-white/40 bg-clip-text text-transparent">
                  TokenvaPay workspace.
                </span>
              </h2>
              <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-white/45">
                Everything on this page is available inside your authenticated
                dashboard. Sign in with your wallet to continue.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  <span className="relative z-10">Open dashboard</span>
                  <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>

                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-7 py-4 text-sm font-medium text-white/65 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M13 8H3M7 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to home
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Footer bar */}
        <div className="relative border-t border-white/8">
          <div className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 text-xs text-white/35 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#8ff5aa]" />
                <span>
                  TokenvaPay · A product of{" "}
                  <a
                    href="https://tokenva-web.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/60 underline decoration-white/15 underline-offset-2 transition hover:text-[#8ff5aa]"
                  >
                    Tokenva
                  </a>
                </span>
              </div>
              <Link href="/app" className="group inline-flex items-center gap-1.5 font-mono transition hover:text-white">
                Return to workspace
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── GLOBAL STYLES ───── */}
      <style jsx global>{`
        @keyframes hwFadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        html { scroll-behavior: smooth; }

        section[id] { scroll-margin-top: 80px; }

        ::selection { background: rgba(143,245,170,0.25); color: white; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #242424; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #383838; }

        /* Remove default details marker in all browsers */
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}