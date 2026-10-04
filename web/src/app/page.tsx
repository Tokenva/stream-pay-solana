"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import ActivityHistory from "@/components/ActivityHistory";
import WalletButton from "@/components/WalletButton";
import { useOrganization } from "@/hooks/useOrganization";
import { useVault } from "@/hooks/useVault";
import { useDeposit } from "@/hooks/useDeposit";
import { useStream } from "@/hooks/useStream";
import { useStreamActions } from "@/hooks/useStreamActions";
import { useIndexedStreams } from "@/hooks/useIndexedStreams";
import ActivityStats from "@/components/ActivityStats";
import OperationalDashboard from "@/components/OperationalDashboard";

const MINT =
  process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";

const DECIMALS = 6;
const BASE_UNITS = BigInt(1_000_000);
const ZERO = BigInt(0);
function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function toBaseUnits(
  value: string,
) {
  const [whole, fraction = ""] =
    value.trim().split(".");

  if (!/^\d+$/.test(whole)) {
    throw new Error(
      "Invalid token amount",
    );
  }

  const padded =
    fraction
      .padEnd(DECIMALS, "0")
      .slice(0, DECIMALS);

  return (
    BigInt(whole) *
    BASE_UNITS +
    BigInt(padded || "0")
  ).toString();
}

function formatDateTimeLocal(date: Date) {
  return `${date
    .getFullYear()
    .toString()
    .padStart(4, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date
        .getDate()
        .toString()
        .padStart(2, "0")}T${date
          .getHours()
          .toString()
          .padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
}

function formatTokenAmount(
  raw: bigint,
) {
  const whole =
    raw / BASE_UNITS;

  const fraction =
    raw % BASE_UNITS;

  if (fraction === ZERO) {
    return whole.toString();
  }

  return `${whole}.${fraction
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "")}`;
}

export default function Home() {
  const { publicKey } = useWallet();

  const [depositAmount, setDepositAmount] =
    useState("");

  const [employeeAddress, setEmployeeAddress] =
    useState("");

  const [streamAmount, setStreamAmount] =
    useState("500");

  const [payrollType, setPayrollType] =
    useState("Salary");

  const [payrollTemplate, setPayrollTemplate] =
    useState("Monthly Salary");

  const [streamId, setStreamId] =
    useState(1);

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [mounted, setMounted] =
    useState(false);

  const [onboardingLoading, setOnboardingLoading] =
    useState(false);

  const [employeeWalletValid, setEmployeeWalletValid] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const now =
      Math.floor(
        Date.now() / 1000,
      );

    const start =
      new Date(
        (now - 3600) * 1000,
      );

    const end =
      new Date(
        (now + 30 * 24 * 3600) * 1000,
      );

    const formatDateTime = (
      date: Date,
    ) =>
      `${date
        .getFullYear()
        .toString()
        .padStart(4, "0")}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${date
            .getDate()
            .toString()
            .padStart(2, "0")}T${date
              .getHours()
              .toString()
              .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

    setStartTime(
      formatDateTime(start),
    );

    setEndTime(
      formatDateTime(end),
    );
  }, []);

  const {
    organization,
    organizationRoles,
    rolesExists,
    exists: organizationExists,
    createOrganization,
  } = useOrganization();

  const {
    vault,
    exists: vaultExists,
    balance: vaultBalance,
    refresh: refreshVault,
    createVault,
  } = useVault(MINT);

  const {
    tokenAccount,
    tokenBalance,
    deposit,
    loading: depositLoading,
  } = useDeposit(
    MINT,
    refreshVault,
  );

  const {
    stream,
    streamEscrow,
    data: streamData,
    claimable,
    loading: streamLoading,
    error: streamError,
    createStream,
    claim,
  } = useStream(
    MINT,
    streamId,
    employeeAddress,
  );

  const {
    loading: actionLoading,
    error: actionErrorStream,
    topUp,
    cancel,
  } = useStreamActions(
    MINT,
    streamId,
    employeeAddress,
    async () => {
      await refreshVault();
    },
  );

  const {
    streams: indexedStreams,
    loading: indexedStreamsLoading,
    error: indexedStreamsError,
    refresh: refreshIndexedStreams,
  } = useIndexedStreams(
    publicKey?.toBase58(),
  );

  async function handleCompanySetup() {
    try {
      setMessage(null);
      setActionError(null);
      setOnboardingLoading(true);

      if (!publicKey) {
        throw new Error("Connect your treasury wallet first");
      }

      if (!organizationExists) {
        await createOrganization();
      }

      if (!vaultExists) {
        await createVault();
      }

      await refreshVault();

      setMessage("Company setup complete");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Company setup failed",
      );
    } finally {
      setOnboardingLoading(false);
    }
  }

  function handleVerifyEmployeeWallet() {
    try {
      const address = employeeAddress.trim();

      if (!address) {
        throw new Error("Enter the employee wallet address");
      }

      const normalized = new PublicKey(address).toBase58();

      setEmployeeAddress(normalized);
      setEmployeeWalletValid(true);
      setMessage("Employee wallet address is valid");
      setActionError(null);
    } catch (err) {
      setEmployeeWalletValid(false);
      setActionError(
        err instanceof Error
          ? err.message
          : "Invalid employee wallet address",
      );
    }
  }

  async function handleDeposit() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await deposit(
          depositAmount,
        );

      setDepositAmount("");

      setMessage(
        `Deposit successful: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Deposit failed",
      );
    }
  }

  async function handleTopUp() {
    try {
      setMessage(null);
      setActionError(null);;

      const rawAmount =
        toBaseUnits("100");

      const signature =
        await topUp(rawAmount);

      setMessage(
        `Stream topped up: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Top-up failed",
      );
    }
  }

  async function handleCancel() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await cancel();

      setMessage(
        `Stream canceled: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Top-up failed",
      );
    }
  }

  function applyPayrollTemplate(template: string) {
    if (template === "Custom") {
      return;
    }

    const start = new Date(
      Date.now() + 5 * 60 * 1000,
    );

    const days =
      template === "Bonus" ? 7 : 30;

    const amount =
      template === "Bonus" ? "100" : "500";

    setPayrollType(
      template === "Monthly Salary"
        ? "Salary"
        : template,
    );
    setStreamAmount(amount);
    setStartTime(formatDateTimeLocal(start));
    setEndTime(
      formatDateTimeLocal(
        new Date(
          start.getTime() +
            days * 24 * 60 * 60 * 1000,
        ),
      ),
    );
  }

  async function handleCreateStream() {

    try {
      setMessage(null);
      setActionError(null);

      if (!startTime || !endTime) {
        throw new Error("Choose stream start and end times");
      }

      const start = Math.floor(
        new Date(startTime).getTime() / 1000,
      );

      const end = Math.floor(
        new Date(endTime).getTime() / 1000,
      );

      const rawAmount = toBaseUnits(streamAmount);

      const result = await createStream(
        employeeAddress,
        rawAmount,
        start,
        end,
      );

      await refreshVault();

      setMessage(
        `${payrollType} payroll created: ${shortenAddress(
          result.stream.toBase58(),
        )}`,
      );
    } catch (err) {
      console.error("CREATE STREAM ERROR:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Create Stream failed",
      );
    }
  }

  async function handleClaim() {
    try {
      setMessage(null);
      setActionError(null);

      const signature =
        await claim();

      setMessage(
        `Claim successful: ${signature.slice(
          0,
          8,
        )}...`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Claim failed",
      );
    }
  }

  const earnedDisplay =
    formatTokenAmount(
      claimable,
    );

  const activeStreamCount =
    indexedStreams.filter((item) => !item.canceled).length;

  const employeeCount =
    new Set(indexedStreams.map((item) => item.employee)).size;

  const employeeDirectory = Array.from(
    new Set(indexedStreams.map((item) => item.employee)),
  ).map((employee) => ({
    address: employee,
    totalStreams: indexedStreams.filter(
      (item) => item.employee === employee,
    ).length,
    activeStreams: indexedStreams.filter(
      (item) =>
        item.employee === employee &&
        !item.canceled,
    ).length,
  }));

  const isOwner = organizationExists && !!publicKey;

  const currentRole =
    isOwner
      ? "Owner"
      : rolesExists && organizationRoles && publicKey
        ? publicKey.equals(organizationRoles.admin)
          ? "Admin"
          : publicKey.equals(organizationRoles.finance)
            ? "Finance"
            : publicKey.equals(organizationRoles.approver)
              ? "Approver"
              : publicKey.equals(organizationRoles.viewer)
                ? "Viewer"
                : "Employee"
        : "Unassigned";

  const canCreatePayroll =
    currentRole === "Owner" ||
    currentRole === "Admin" ||
    currentRole === "Approver";

  const canManageTreasury =
    currentRole === "Owner" ||
    currentRole === "Admin" ||
    currentRole === "Finance";

  const canManageStreams =
    currentRole === "Owner" ||
    currentRole === "Admin" ||
    currentRole === "Finance" ||
    currentRole === "Approver";

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Trustless Payroll Protocol
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              StreamPay
            </h1>
          </div>

          <WalletButton />
        </header>

        {message && (
          <div className="mt-8 rounded-xl border border-green-900 bg-green-950/40 p-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {actionError && (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {actionError}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-sm text-zinc-400">
              Payroll Dashboard
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Company Overview
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Treasury Balance",
                value: vaultBalance ?? "0",
              },
              {
                label: "Payroll This Month",
                value: "—",
              },
              {
                label: "Active Streams",
                value: activeStreamCount.toString(),
              },
              {
                label: "Pending Actions",
                value: "—",
              },
              {
                label: "Employees",
                value: employeeCount.toString(),
              },
              {
                label: "Recent Activity",
                value: indexedStreams.length > 0
                  ? "Available"
                  : "None yet",
              },
              {
                label: "Your Role",
                value: currentRole,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <p className="text-sm text-zinc-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <OperationalDashboard />

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                Company Onboarding
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {organizationExists && vaultExists
                  ? "Company ready"
                  : "Set up your payroll company"}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Connect the treasury wallet, create the company, and initialize its payroll vault.
              </p>
            </div>

            <button
              type="button"
              disabled={
                onboardingLoading ||
                !publicKey ||
                !MINT ||
                (organizationExists && vaultExists)
              }
              onClick={handleCompanySetup}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              {onboardingLoading
                ? "Setting up..."
                : organizationExists && vaultExists
                  ? "Setup Complete"
                  : "Set Up Company"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Company</p>
              <p className="mt-1 text-sm">
                {organizationExists ? "Created" : "Not created"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Payroll Vault</p>
              <p className="mt-1 text-sm">
                {vaultExists ? "Ready" : "Not initialized"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                Access Control
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Your permissions
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Available actions follow your organization role.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-700 px-4 py-3 text-sm">
              <span className="text-zinc-500">
                Current role
              </span>
              <span className="ml-2 font-semibold">
                {currentRole}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Create payroll", canCreatePayroll],
              ["Deposit treasury", canManageTreasury],
              ["Manage streams", canManageStreams],
              ["Claim payroll", currentRole === "Employee"],
            ] as [string, boolean][]).map(([label, allowed]) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-800 p-4"
              >
                <p className="text-sm font-medium">
                  {label}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    allowed
                      ? "text-green-400"
                      : "text-zinc-600"
                  }`}
                >
                  {allowed ? "Available" : "Restricted"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Wallet
            </p>

            <p className="mt-3 break-all">
              {publicKey
                ? shortenAddress(
                  publicKey.toBase58(),
                )
                : "Not connected"}
            </p>

            <p className="mt-6 text-sm text-zinc-400">
              Token Balance
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {tokenBalance ?? "0"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Organization
            </p>

            <p className="mt-3 break-all">
              {organization
                ? shortenAddress(
                  organization.toBase58(),
                )
                : "—"}
            </p>

            <p
              className={`mt-5 text-sm ${organizationExists
                ? "text-green-400"
                : "text-yellow-400"
                }`}
            >
              {organizationExists
                ? "Organization exists"
                : "Organization not found"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-400">
              Vault
            </p>

            <p className="mt-3 break-all">
              {vault
                ? shortenAddress(
                  vault.toBase58(),
                )
                : "—"}
            </p>

            <p className="mt-5 text-sm text-zinc-400">
              Balance
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {vaultBalance ?? "0"}
            </p>

            <p
              className={`mt-4 text-sm ${vaultExists
                ? "text-green-400"
                : "text-yellow-400"
                }`}
            >
              {vaultExists
                ? "Vault exists"
                : "Vault not found"}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Token Mint
          </p>

          <p className="mt-2 break-all text-sm">
            {MINT}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Employee Onboarding
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Add employee wallet
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Enter and validate the wallet that will receive payroll.
          </p>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row">
            <input
              value={employeeAddress}
              onChange={(event) => {
                setEmployeeAddress(event.target.value);
                setEmployeeWalletValid(false);
              }}
              placeholder="Employee wallet address"
              className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <button
              type="button"
              disabled={!employeeAddress.trim()}
              onClick={handleVerifyEmployeeWallet}
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Verify Wallet
            </button>
          </div>

          <p className={`mt-4 text-sm ${
            employeeWalletValid
              ? "text-green-400"
              : "text-zinc-500"
          }`}>
            {employeeWalletValid
              ? "Wallet address validated"
              : "Employee wallet not validated"}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Payroll
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Employee Directory
          </h2>

          {employeeDirectory.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-500">
              No employees found.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {employeeDirectory.map((employee) => (
                <div
                  key={employee.address}
                  className="rounded-xl border border-zinc-800 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {shortenAddress(employee.address)}
                      </p>
                      <p className="mt-1 break-all text-xs text-zinc-500">
                        {employee.address}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 text-sm sm:items-end">
                      <div className="text-zinc-400">
                        {employee.activeStreams} active / {employee.totalStreams} total streams
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEmployeeAddress(employee.address);
                          setEmployeeWalletValid(true);
                          setMessage(
                            `Selected employee ${shortenAddress(employee.address)}`,
                          );
                          setActionError(null);
                        }}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-900"
                      >
                        Use for Payroll
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Treasury Deposit
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Fund company payroll
          </h2>

          <p className={`mt-2 text-sm ${
            canManageTreasury
              ? "text-green-400"
              : "text-zinc-600"
          }`}>
            {canManageTreasury
              ? "Your role can fund the company treasury."
              : "Your current role cannot perform treasury deposits."}
          </p>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row">
            <input
              value={depositAmount}
              onChange={(event) =>
                setDepositAmount(
                  event.target.value,
                )
              }
              placeholder="Amount"
              inputMode="decimal"
              className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none"
            />

            <button
              type="button"
              disabled={
                depositLoading ||
                !canManageTreasury ||
                !vaultExists ||
                !tokenAccount ||
                !depositAmount
              }
              onClick={handleDeposit}
              className="rounded-xl cursor-pointer bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
            >
              {depositLoading
                ? "Depositing..."
                : "Deposit"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div>
            <p className="text-sm text-zinc-400">
              Payment Stream
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Create Payroll
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <select
              value={payrollTemplate}
              onChange={(event) => {
                const value = event.target.value;
                setPayrollTemplate(value);
                applyPayrollTemplate(value);
              }}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            >
              <option value="Monthly Salary">
                Monthly Salary Template
              </option>
              <option value="Contractor">
                Contractor Template
              </option>
              <option value="Bonus">
                Bonus Template
              </option>
              <option value="Custom">
                Custom Payroll
              </option>
            </select>

            <select
              value={payrollType}
              onChange={(event) =>
                setPayrollType(event.target.value)
              }
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            >
              <option value="Salary">Salary</option>
              <option value="Contractor">Contractor</option>
              <option value="Bonus">Bonus</option>
            </select>
            <input
              value={employeeAddress}
              onChange={(event) =>
                setEmployeeAddress(
                  event.target.value,
                )
              }
              placeholder="Employee wallet address"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <input
              value={streamId}
              onChange={(event) =>
                setStreamId(
                  Number(event.target.value),
                )
              }
              type="number"
              min="1"
              placeholder="Stream ID"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <input
              value={streamAmount}
              onChange={(event) =>
                setStreamAmount(
                  event.target.value,
                )
              }
              inputMode="decimal"
              placeholder="Total amount"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            {mounted && (
              <>
                <input
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />

                <input
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />
              </>
            )}
          </div>

          <button
            type="button"
            disabled={
              streamLoading ||
              !canCreatePayroll ||
              !vaultExists ||
              !employeeWalletValid ||
              !streamAmount
            }
            onClick={
              handleCreateStream
            }
            className="mt-5 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
          >
            {streamLoading
              ? "Creating..."
              : `Create ${payrollType} Payroll` }
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Active Stream
          </p>

          {streamData ? (
            <>
              <div className="mt-5 grid gap-5 md:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500">
                    Stream
                  </p>

                  <p className="mt-2 break-all text-sm">
                    {stream
                      ? shortenAddress(
                        stream.toBase58(),
                      )
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Total
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {formatTokenAmount(
                      BigInt(
                        streamData.totalAmount.toString(),
                      ),
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Claimable
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {earnedDisplay}
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-zinc-800 p-4">
                  <p className="text-xs text-zinc-500">
                    Stream Management
                  </p>
                  <p className={`mt-2 text-sm ${
                    canManageStreams
                      ? "text-green-400"
                      : "text-zinc-600"
                  }`}>
                    {canManageStreams
                      ? `${currentRole} can top up and cancel streams.`
                      : `${currentRole} has read-only stream access.`}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !canManageStreams ||
                      streamData.canceled
                    }
                    onClick={handleTopUp}
                    className="rounded-xl cursor-pointer border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Top Up 100"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !canManageStreams ||
                      streamData.canceled
                    }
                    onClick={handleCancel}
                    className="rounded-xl cursor-pointer border border-red-900 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-40"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Cancel Stream"}
                  </button>
                </div>

                {actionErrorStream && (
                  <p className="mt-4 text-sm text-red-400">
                    {actionErrorStream}
                  </p>
                )}

                <div>
                  <p className="text-xs text-zinc-500">
                    Status
                  </p>

                  <p className="mt-2">
                    {streamData.canceled
                      ? "Canceled"
                      : "Active"}
                  </p>
                </div>
              </div>

              {streamEscrow && (
                <p className="mt-5 break-all text-xs text-zinc-500">
                  Escrow:{" "}
                  {shortenAddress(
                    streamEscrow.toBase58(),
                  )}
                </p>
              )}

              {streamError && (
                <p className="mt-4 text-sm text-red-400">
                  {streamError}
                </p>
              )}

              <button
                type="button"
                disabled={
                  streamLoading ||
                  claimable === ZERO ||
                  streamData.canceled
                }
                onClick={
                  handleClaim
                }
                className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
              >
                {streamLoading
                  ? "Processing..."
                  : claimable > ZERO
                    ? `Claim ${earnedDisplay}`
                    : "Nothing to claim yet"}
              </button>
            </>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              No Stream found for the current
              wallet and Stream ID.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Indexed Streams
              </h2>

              <p className="text-sm text-white/50">
                Data served by StreamPay backend
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refreshIndexedStreams()}
              className="rounded cursor-pointer lg border border-white/10 px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>

          {indexedStreamsLoading && (
            <p className="text-sm text-white/50">
              Loading indexed streams...
            </p>
          )}

          {indexedStreamsError && (
            <p className="text-sm text-red-400">
              {indexedStreamsError}
            </p>
          )}

          {!indexedStreamsLoading &&
            !indexedStreamsError &&
            indexedStreams.length === 0 && (
              <p className="text-sm text-white/50">
                No indexed streams found.
              </p>
            )}

          <div className="space-y-3">
            {indexedStreams.map((stream) => (
              <div
                key={stream.address}
                className="rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <span>
                    Stream #{stream.stream_id}
                  </span>

                  <span
                    className={
                      stream.canceled
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {stream.canceled
                      ? "Canceled"
                      : "Active"}
                  </span>
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {stream.address}
                </div>
              </div>
            ))}
          </div>
        </section>
        <ActivityStats />
        <ActivityHistory />
      </div>
    </main>
  );
}
