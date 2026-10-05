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
  setEmployeeWalletValid,
  employeeDirectory,
  onVerify,
  onSelect,
  shortenAddress,
}: EmployeeDirectoryProps) {
  return (
    <>
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
            onClick={onVerify}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Verify Wallet
          </button>
        </div>

        <p
          className={`mt-4 text-sm ${
            employeeWalletValid
              ? "text-green-400"
              : "text-zinc-500"
          }`}
        >
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
                      {employee.activeStreams} active /{" "}
                      {employee.totalStreams} total streams
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelect(employee.address)
                      }
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
    </>
  );
}
