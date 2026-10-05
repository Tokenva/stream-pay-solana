"use client";

type CompanySetupProps = {
  organizationExists: boolean;
  vaultExists: boolean;
  onboardingLoading: boolean;
  publicKey: string | null;
  mint: string;
  currentRole: string;
  canCreatePayroll: boolean;
  canManageTreasury: boolean;
  canManageStreams: boolean;
  canClaimPayroll: boolean;
  organizationAddress: string | null;
  vaultAddress: string | null;
  vaultBalance: string;
  tokenBalance: string;
  onSetup: () => void;
  shortenAddress: (address: string) => string;
};

export default function CompanySetup({
  organizationExists,
  vaultExists,
  onboardingLoading,
  publicKey,
  mint,
  currentRole,
  canCreatePayroll,
  canManageTreasury,
  canManageStreams,
  canClaimPayroll,
  organizationAddress,
  vaultAddress,
  vaultBalance,
  tokenBalance,
  onSetup,
  shortenAddress,
}: CompanySetupProps) {
  return (
    <>
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
              !mint ||
              (organizationExists && vaultExists)
            }
            onClick={onSetup}
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
            <p className="text-xs text-zinc-500">
              Company
            </p>
            <p className="mt-1 text-sm">
              {organizationExists ? "Created" : "Not created"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">
              Payroll Vault
            </p>
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
            ["Claim payroll", canClaimPayroll],
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
              ? shortenAddress(publicKey)
              : "Not connected"}
          </p>

          <p className="mt-6 text-sm text-zinc-400">
            Token Balance
          </p>

          <p className="mt-1 text-3xl font-semibold">
            {tokenBalance}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Organization
          </p>

          <p className="mt-3 break-all">
            {organizationAddress
              ? shortenAddress(organizationAddress)
              : "—"}
          </p>

          <p
            className={`mt-5 text-sm ${
              organizationExists
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
            {vaultAddress
              ? shortenAddress(vaultAddress)
              : "—"}
          </p>

          <p className="mt-5 text-sm text-zinc-400">
            Balance
          </p>

          <p className="mt-1 text-3xl font-semibold">
            {vaultBalance}
          </p>

          <p
            className={`mt-4 text-sm ${
              vaultExists
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
          {mint}
        </p>
      </section>
    </>
  );
}
