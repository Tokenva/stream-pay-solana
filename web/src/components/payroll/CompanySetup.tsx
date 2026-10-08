"use client";

type CompanySetupProps = {
  organizationExists: boolean;
  vaultExists: boolean;
  rolesExists: boolean;
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
  rolesExists,
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
  const setupComplete =
    organizationExists && vaultExists && rolesExists;

  return (
    <>
      <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                01
              </span>

              <p className="text-sm font-medium text-zinc-400">
                Company & Treasury
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              {setupComplete
                ? "Your company is ready"
                : "Set up your payroll company"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Create the company organization and initialize the
              payroll vault before funding treasury or creating
              payment streams.
            </p>
          </div>

          <button
            type="button"
            disabled={
              onboardingLoading ||
              !publicKey ||
              !mint ||
              setupComplete
            }
            onClick={onSetup}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {onboardingLoading
              ? "Setting up..."
              : setupComplete
                ? "Setup Complete"
                : "Set Up Company"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                Company
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  organizationExists
                    ? "bg-green-500/10 text-green-400"
                    : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {organizationExists
                  ? "Ready"
                  : "Required"}
              </span>
            </div>

            <p className="mt-3 text-sm">
              {organizationExists
                ? "Organization has been created."
                : "Organization still needs to be created."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                Payroll Vault
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  vaultExists
                    ? "bg-green-500/10 text-green-400"
                    : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {vaultExists
                  ? "Ready"
                  : "Required"}
              </span>
            </div>

            <p className="mt-3 text-sm">
              {vaultExists
                ? "Payroll vault is initialized."
                : "Payroll vault still needs to be initialized."}
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
              Available payroll actions are determined by your organization role.
            </p>
          </div>

          <div className="rounded-xl flex items-start justify-center gap-3 flex-nowrap border border-zinc-700 bg-black/30 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Current role
            </p>

            <p className="text-xs font-semibold">
              {currentRole}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Create payroll", canCreatePayroll],
              ["Deposit treasury", canManageTreasury],
              ["Manage streams", canManageStreams],
              ["Claim payroll", canClaimPayroll],
            ] as [string, boolean][]
          ).map(([label, allowed]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  {label}
                </p>

                <span
                  className={`h-2 w-2 rounded-full ${
                    allowed
                      ? "bg-green-400"
                      : "bg-zinc-700"
                  }`}
                />
              </div>

              <p
                className={`mt-3 text-xs ${
                  allowed
                    ? "text-green-400"
                    : "text-zinc-600"
                }`}
              >
                {allowed
                  ? "Available"
                  : "Restricted"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div>
          <p className="text-sm text-zinc-400">
            Technical Details
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Company infrastructure
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Wallet, organization, vault, and token information
            used by the payroll workspace.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Treasury wallet
            </p>

            <p className="mt-3 break-all text-sm">
              {publicKey
                ? shortenAddress(publicKey)
                : "Not connected"}
            </p>

            <p className="mt-5 text-xs text-zinc-500">
              Token balance
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {tokenBalance}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Organization
            </p>

            <p className="mt-3 break-all text-sm">
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

          <div className="rounded-xl border border-zinc-800 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Payroll vault
            </p>

            <p className="mt-3 break-all text-sm">
              {vaultAddress
                ? shortenAddress(vaultAddress)
                : "—"}
            </p>

            <p className="mt-5 text-xs text-zinc-500">
              Vault balance
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {vaultBalance}
            </p>

            <p
              className={`mt-3 text-sm ${
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
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Token mint
          </p>

          <p className="mt-3 break-all text-sm text-zinc-300">
            {mint}
          </p>
        </div>
      </section>
    </>
  );
}