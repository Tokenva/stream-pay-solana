"use client";

type EmployeeWorkspaceProps = {
  companyName: string;
  currentRole: string;
  walletAddress: string | null;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function EmployeeWorkspace({
  companyName,
  currentRole,
  walletAddress,
}: EmployeeWorkspaceProps) {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="dashboard-brand-block">
            <p className="dashboard-eyebrow">
              Employee workspace
            </p>

            <h1 className="dashboard-title">
              TokenvaPay
            </h1>

            <p className="dashboard-subtitle">
              Your payroll, earnings, claims, and payment history in one
              secure workspace.
            </p>
          </div>

          <div className="dashboard-wallet">
            <span className="text-xs text-zinc-500">
              {walletAddress
                ? shortenAddress(walletAddress)
                : "Wallet"}
            </span>
          </div>
        </header>

        <nav
          className="demo-nav"
          aria-label="Employee dashboard sections"
        >
          <a href="#my-company">My Company</a>
          <a href="#my-payroll">My Payroll</a>
          <a href="#claimable">Claimable</a>
          <a href="#payment-history">Payment History</a>
        </nav>

        <section
          id="my-company"
          className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            My Company
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {companyName}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            You are enrolled as an employee in this TokenvaPay
            workspace.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Role
              </p>

              <p className="mt-3 text-lg font-semibold">
                {currentRole}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Wallet
              </p>

              <p className="mt-3 break-all text-sm">
                {walletAddress
                  ? shortenAddress(walletAddress)
                  : "Not connected"}
              </p>
            </div>
          </div>
        </section>

        <section
          id="my-payroll"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            My Payroll
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Payroll streams
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Your payroll streams and scheduled payments will appear
            here.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-500">
              No payroll details available yet.
            </p>
          </div>
        </section>

        <section
          id="claimable"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            Claimable
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Claim your earnings
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Claimable payroll earnings will appear here.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-500">
              Claim functionality will be available in the employee
              payroll flow.
            </p>
          </div>
        </section>

        <section
          id="payment-history"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm text-zinc-400">
            Payment History
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Payroll payment history
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Completed payroll claims will appear here.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-500">
              No payment history available yet.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}