"use client";

type TreasuryFundingProps = {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  depositLoading: boolean;
  canManageTreasury: boolean;
  vaultExists: boolean;
  tokenAccount: boolean;
  onDeposit: () => void;
};

export default function TreasuryFunding({
  depositAmount,
  setDepositAmount,
  depositLoading,
  canManageTreasury,
  vaultExists,
  tokenAccount,
  onDeposit,
}: TreasuryFundingProps) {
  const ready =
    canManageTreasury &&
    vaultExists &&
    tokenAccount;

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
          <p className="text-sm text-zinc-400">
            Treasury Funding
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Fund company payroll
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Deposit payroll funds into the company vault so
            payment streams can be created and funded.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-5">
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
              onChange={(event) =>
                setDepositAmount(event.target.value)
              }
              placeholder="Enter token amount"
              inputMode="decimal"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none transition focus:border-zinc-600"
            />
          </div>

          <button
            type="button"
            disabled={
              depositLoading ||
              !ready ||
              !depositAmount
            }
            onClick={onDeposit}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {depositLoading
              ? "Depositing..."
              : "Deposit to Treasury"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Treasury permission
          </p>

          <p
            className={`mt-2 text-sm ${
              canManageTreasury
                ? "text-green-400"
                : "text-zinc-600"
            }`}
          >
            {canManageTreasury
              ? "Available"
              : "Restricted"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Payroll vault
          </p>

          <p
            className={`mt-2 text-sm ${
              vaultExists
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {vaultExists
              ? "Ready"
              : "Not initialized"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Token account
          </p>

          <p
            className={`mt-2 text-sm ${
              tokenAccount
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {tokenAccount
              ? "Available"
              : "Not available"}
          </p>
        </div>
      </div>
    </section>
  );
}