"use client";

type Employee = {
  address: string;
  totalStreams: number;
  activeStreams: number;
};

type EmployeeDirectoryProps = {
  employeeAddress: string;
  setEmployeeAddress: (value: string) => void;
  employeeWalletValid: boolean;
  setEmployeeWalletValid: (value: boolean) => void;
  employeeDirectory: Employee[];
  onVerify: () => void;
  onSelect: (address: string) => void;
  shortenAddress: (address: string) => string;
};

export default function EmployeeDirectory({
  employeeAddress,
  setEmployeeAddress,
  employeeWalletValid,
  employeeDirectory,
  onVerify,
  onSelect,
}: EmployeeDirectoryProps) {
  return (
    <>
      <section
        id="employees"
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
            02
          </span>

          <div>
            <p className="text-sm text-zinc-400">
              People
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Add an employee
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Verify the Solana wallet that should receive
              payroll before creating a payment stream.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-5">
          <label
            htmlFor="employee-wallet"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Employee wallet
          </label>

          <div className="mt-2 flex flex-col gap-3 lg:flex-row">
            <input
              id="employee-wallet"
              value={employeeAddress}
              onChange={(event) => {
                setEmployeeAddress(event.target.value);
              }}
              placeholder="Enter Solana wallet address"
              className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
            />

            <button
              type="button"
              disabled={!employeeAddress.trim()}
              onClick={onVerify}
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verify Wallet
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                employeeWalletValid
                  ? "bg-green-400"
                  : "bg-zinc-700"
              }`}
            />

            <p
              className={`text-sm ${
                employeeWalletValid
                  ? "text-green-400"
                  : "text-zinc-500"
              }`}
            >
              {employeeWalletValid
                ? "Wallet address validated"
                : "Wallet address not validated"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">
              Existing people
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Employee Directory
            </h2>
          </div>

          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
            {employeeDirectory.length}{" "}
            {employeeDirectory.length === 1
              ? "employee"
              : "employees"}
          </span>
        </div>

        {employeeDirectory.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-500">
              No employees found yet.
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Verify a wallet above to prepare the first
              payroll stream.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {employeeDirectory.map((employee) => (
              <div
                key={employee.address}
                className="rounded-xl border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {employee.address.slice(0, 4)}...
                      {employee.address.slice(-4)}
                    </p>

                    <p className="mt-1 break-all text-xs text-zinc-600">
                      {employee.address}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="text-xs text-zinc-500">
                      <span className="text-zinc-300">
                        {employee.activeStreams}
                      </span>{" "}
                      active ·{" "}
                      <span className="text-zinc-300">
                        {employee.totalStreams}
                      </span>{" "}
                      total
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelect(employee.address)
                      }
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold transition hover:bg-zinc-900"
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
    </>
  );
}