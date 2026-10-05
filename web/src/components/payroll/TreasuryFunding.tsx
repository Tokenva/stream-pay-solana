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
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <p className="text-sm text-zinc-400">
        Treasury Deposit
      </p>

      <h2 className="mt-1 text-xl font-semibold">
        Fund company payroll
      </h2>

      <p
        className={`mt-2 text-sm ${
          canManageTreasury
            ? "text-green-400"
            : "text-zinc-600"
        }`}
      >
        {canManageTreasury
          ? "Your role can fund the company treasury."
          : "Your current role cannot perform treasury deposits."}
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <input
          value={depositAmount}
          onChange={(event) =>
            setDepositAmount(event.target.value)
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
          onClick={onDeposit}
          className="rounded-xl cursor-pointer bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
        >
          {depositLoading
            ? "Depositing..."
            : "Deposit"}
        </button>
      </div>
    </section>
  );
}
