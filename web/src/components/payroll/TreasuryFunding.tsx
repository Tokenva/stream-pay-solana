"use client";

import { useState } from "react";

type TreasuryFundingProps = {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  depositLoading: boolean;
  tokenBalance: string;
  mintAddress: string;
  walletAddress: string;
  onRefreshBalance: () => void;
  canManageTreasury: boolean;
  vaultExists: boolean;
  tokenAccount: boolean;
  onDeposit: () => void;
};

export default function TreasuryFunding({
  depositAmount,
  setDepositAmount,
  depositLoading,
  tokenBalance,
  mintAddress,
  walletAddress,
  onRefreshBalance,
  canManageTreasury,
  vaultExists,
  tokenAccount,
  onDeposit,
}: TreasuryFundingProps) {
  const [fundingHelpOpen, setFundingHelpOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<"mint" | "wallet" | null>(null);

  async function copyValue(value: string, field: "mint" | "wallet") {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopiedField(field);

    window.setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  }

  const ready = canManageTreasury && vaultExists && tokenAccount;

  const numericTokenBalance = Number.parseFloat(tokenBalance) || 0;
  const numericDepositAmount = Number.parseFloat(depositAmount) || 0;

  const insufficientBalance =
    numericDepositAmount > 0 && numericDepositAmount > numericTokenBalance;

  return (
    <section
      id="treasury"
      className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
          01
        </span>

        <div>
          <p className="text-sm text-zinc-400">Treasury Funding</p>

          <h2 className="mt-1 text-xl font-semibold">Fund company payroll</h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Deposit payroll funds into the company vault so payment streams can
            be created and funded.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-5">
        {/* Available STREAM balance */}
        <div className="mb-5 rounded-xl border border-zinc-800 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Available STREAM
          </p>

          <p className="mt-2 text-2xl font-semibold">{tokenBalance} STREAM</p>
        </div>

        {/* Zero / insufficient balance warning */}
        {numericTokenBalance <= 0 && (
          <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] p-4">
            <p className="text-sm font-medium text-yellow-300">
              Insufficient STREAM balance
            </p>

            <p className="mt-1 text-sm leading-5 text-zinc-500">
              Your wallet does not have STREAM tokens. You need STREAM to fund
              payroll.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFundingHelpOpen(true)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                Get STREAM
              </button>

              <button
                type="button"
                onClick={() => setFundingHelpOpen(true)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
              >
                How to fund
              </button>
            </div>
          </div>
        )}

        {/* Funding help panel */}
        {fundingHelpOpen && (
          <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Fund this wallet with STREAM
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  Send STREAM to the connected owner wallet below. After the
                  transfer completes, refresh your balance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFundingHelpOpen(false)}
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  STREAM mint
                </p>

                <div className="mt-2 flex gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg border border-zinc-800 bg-black px-3 py-3 text-xs text-zinc-400">
                    {mintAddress || "Mint unavailable"}
                  </code>

                  <button
                    type="button"
                    disabled={!mintAddress}
                    onClick={() => void copyValue(mintAddress, "mint")}
                    className="shrink-0 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-40"
                  >
                    {copiedField === "mint" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Owner wallet
                </p>

                <div className="mt-2 flex gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg border border-zinc-800 bg-black px-3 py-3 text-xs text-zinc-400">
                    {walletAddress || "Wallet unavailable"}
                  </code>

                  <button
                    type="button"
                    disabled={!walletAddress}
                    onClick={() => void copyValue(walletAddress, "wallet")}
                    className="shrink-0 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-40"
                  >
                    {copiedField === "wallet" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black/30 p-4">
                <p className="text-sm text-zinc-400">Funding steps</p>

                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-5 text-zinc-500">
                  <li>Obtain STREAM on the configured Solana network.</li>
                  <li>Send STREAM to the owner wallet shown above.</li>
                  <li>Wait for the transaction to confirm.</li>
                  <li>
                    Click{" "}
                    <strong className="text-zinc-300">Refresh balance</strong>{" "}
                    below.
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={onRefreshBalance}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Refresh balance
              </button>
            </div>
          </div>
        )}

        {/* Deposit amount + button */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label
              htmlFor="treasury-deposit-amount"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Deposit amount
            </label>

            <input
              id="treasury-deposit-amount"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="Enter token amount"
              inputMode="decimal"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none transition focus:border-zinc-600"
            />

            {insufficientBalance && (
              <p className="mt-2 text-xs text-red-400">
                Insufficient STREAM balance. You have {tokenBalance} STREAM
                available.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={
              depositLoading ||
              !ready ||
              !depositAmount ||
              insufficientBalance
            }
            onClick={onDeposit}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {depositLoading ? "Depositing..." : "Deposit to Treasury"}
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">Treasury permission</p>

          <p
            className={`mt-2 text-sm ${
              canManageTreasury ? "text-green-400" : "text-zinc-600"
            }`}
          >
            {canManageTreasury ? "Available" : "Restricted"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">Payroll vault</p>

          <p
            className={`mt-2 text-sm ${
              vaultExists ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {vaultExists ? "Ready" : "Not initialized"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">Token account</p>

          <p
            className={`mt-2 text-sm ${
              tokenAccount ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {tokenAccount ? "Available" : "Not available"}
          </p>
        </div>
      </div>
    </section>
  );
}