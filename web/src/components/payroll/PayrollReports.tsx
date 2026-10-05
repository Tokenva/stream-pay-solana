"use client";

type PayrollReport = {
  employees: number;
  grossPayout: string;
  totalClaimed: string;
  completed: number;
  pending: number;
  canceled: number;
};

type EmployeeReport = {
  employee: string;
  streamCount: number;
  grossPayout: string;
  totalClaimed: string;
  remaining: string;
  completed: number;
  pending: number;
  canceled: number;
};

type TreasuryReport = {
  streamCount: number;
  grossPayout: string;
  totalClaimed: string;
  outstanding: string;
  active: number;
  completed: number;
  canceled: number;
};

type ReconciliationReport = {
  checked: number;
  matched: number;
  mismatched: number;
  missingFromDb: number;
  staleInDb: number;
  healthy: boolean;
  details: Array<{
    type: string;
    address: string;
    fields?: string[];
  }>;
};

type PayrollReportsProps = {
  payrollReport: PayrollReport | null;
  payrollReportLoading: boolean;
  payrollReportError: string | null;
  employeeReports: EmployeeReport[];
  employeeReportLoading: boolean;
  employeeReportError: string | null;
  treasuryReport: TreasuryReport | null;
  treasuryReportLoading: boolean;
  treasuryReportError: string | null;
  reconciliationReport: ReconciliationReport | null;
  reconciliationLoading: boolean;
  reconciliationError: string | null;
  exportLoading: string | null;
  onPayrollRefresh: () => void;
  onEmployeeRefresh: () => void;
  onTreasuryRefresh: () => void;
  onReconciliation: () => void;
  onExport: (
    type: "payroll" | "employees" | "transactions",
  ) => void;
  shortenAddress: (address: string) => string;
  formatTokenAmount: (raw: bigint) => string;
};

export default function PayrollReports({
  payrollReport,
  payrollReportLoading,
  payrollReportError,
  employeeReports,
  employeeReportLoading,
  employeeReportError,
  treasuryReport,
  treasuryReportLoading,
  treasuryReportError,
  reconciliationReport,
  reconciliationLoading,
  reconciliationError,
  exportLoading,
  onPayrollRefresh,
  onEmployeeRefresh,
  onTreasuryRefresh,
  onReconciliation,
  onExport,
  shortenAddress,
  formatTokenAmount,
}: PayrollReportsProps) {
  return (
    <>
      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Finance
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Monthly Payroll Summary
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Payroll activity reported from indexed StreamPay streams.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPayrollRefresh}
              disabled={payrollReportLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {payrollReportLoading
                ? "Refreshing..."
                : "Refresh Report"}
            </button>

            <button
              type="button"
              onClick={() => onExport("payroll")}
              disabled={exportLoading !== null}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {exportLoading === "payroll"
                ? "Exporting..."
                : "Export Payroll CSV"}
            </button>

            <button
              type="button"
              onClick={() => onExport("employees")}
              disabled={exportLoading !== null}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {exportLoading === "employees"
                ? "Exporting..."
                : "Export Employee CSV"}
            </button>

            <button
              type="button"
              onClick={() => onExport("transactions")}
              disabled={exportLoading !== null}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {exportLoading === "transactions"
                ? "Exporting..."
                : "Export Transactions CSV"}
            </button>
          </div>
        </div>

        {payrollReportError && (
          <p className="mt-5 text-sm text-red-400">
            {payrollReportError}
          </p>
        )}

        {payrollReport && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Employees" value={payrollReport.employees} />
            <Metric
              label="Gross Payout"
              value={formatTokenAmount(BigInt(payrollReport.grossPayout))}
            />
            <Metric
              label="Total Claimed"
              value={formatTokenAmount(BigInt(payrollReport.totalClaimed))}
            />
            <Metric
              label="Completed"
              value={payrollReport.completed}
              className="text-green-400"
            />
            <Metric label="Pending" value={payrollReport.pending} />
            <Metric
              label="Canceled"
              value={payrollReport.canceled}
              className="text-red-400"
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Finance
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Treasury Payroll Obligations
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Current-month payroll obligations derived from indexed streams.
            </p>
          </div>

          <button
            type="button"
            onClick={onTreasuryRefresh}
            disabled={treasuryReportLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {treasuryReportLoading
              ? "Refreshing..."
              : "Refresh Report"}
          </button>
        </div>

        {treasuryReportError && (
          <p className="mt-5 text-sm text-red-400">
            {treasuryReportError}
          </p>
        )}

        {treasuryReport && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Gross Payroll"
                value={formatTokenAmount(BigInt(treasuryReport.grossPayout))}
              />
              <Metric
                label="Claimed"
                value={formatTokenAmount(BigInt(treasuryReport.totalClaimed))}
                className="text-green-400"
              />
              <Metric
                label="Outstanding"
                value={formatTokenAmount(BigInt(treasuryReport.outstanding))}
              />
              <Metric
                label="Streams"
                value={treasuryReport.streamCount}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Metric
                label="Active"
                value={treasuryReport.active}
              />
              <Metric
                label="Completed"
                value={treasuryReport.completed}
                className="text-green-400"
              />
              <Metric
                label="Canceled"
                value={treasuryReport.canceled}
                className="text-red-400"
              />
            </div>

            <p className="mt-5 text-xs text-zinc-600">
              Treasury cash-in/cash-out amounts are not reported here because the current transaction record stores status and metadata, but not transaction amounts.
            </p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Operations
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Stream Reconciliation
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Compares on-chain stream accounts with indexed database records.
            </p>
          </div>

          <button
            type="button"
            onClick={onReconciliation}
            disabled={reconciliationLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {reconciliationLoading
              ? "Checking..."
              : "Run Reconciliation"}
          </button>
        </div>

        {reconciliationError && (
          <p className="mt-5 text-sm text-red-400">
            {reconciliationError}
          </p>
        )}

        {reconciliationReport && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Checked"
                value={reconciliationReport.checked}
              />
              <Metric
                label="Matched"
                value={reconciliationReport.matched}
                className="text-green-400"
              />
              <Metric
                label="Mismatched"
                value={reconciliationReport.mismatched}
                className="text-red-400"
              />
              <Metric
                label="Missing / Stale"
                value={
                  reconciliationReport.missingFromDb +
                  reconciliationReport.staleInDb
                }
              />
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 p-4">
              <p
                className={
                  reconciliationReport.healthy
                    ? "text-sm font-semibold text-green-400"
                    : "text-sm font-semibold text-red-400"
                }
              >
                {reconciliationReport.healthy
                  ? "Database is synchronized with on-chain streams."
                  : "Reconciliation found differences that require investigation."}
              </p>
            </div>

            {reconciliationReport.details.length > 0 && (
              <div className="mt-5 space-y-3">
                {reconciliationReport.details.map(
                  (detail, index) => (
                    <div
                      key={`${detail.type}-${detail.address}-${index}`}
                      className="rounded-xl border border-red-950 bg-red-950/20 p-4"
                    >
                      <p className="text-sm font-medium text-red-300">
                        {detail.type}
                      </p>

                      <p className="mt-1 break-all text-xs text-zinc-500">
                        {detail.address}
                      </p>

                      {detail.fields &&
                        detail.fields.length > 0 && (
                          <p className="mt-2 text-xs text-zinc-400">
                            Fields:{" "}
                            {detail.fields.join(", ")}
                          </p>
                        )}
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Finance
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Employee Payroll Report
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Monthly payroll totals grouped by employee wallet.
            </p>
          </div>

          <button
            type="button"
            onClick={onEmployeeRefresh}
            disabled={employeeReportLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {employeeReportLoading
              ? "Refreshing..."
              : "Refresh Report"}
          </button>
        </div>

        {employeeReportError && (
          <p className="mt-5 text-sm text-red-400">
            {employeeReportError}
          </p>
        )}

        {employeeReportLoading &&
          employeeReports.length === 0 && (
            <p className="mt-6 text-sm text-zinc-500">
              Loading employee reports...
            </p>
          )}

        {!employeeReportLoading &&
          !employeeReportError &&
          employeeReports.length === 0 && (
            <p className="mt-6 text-sm text-zinc-500">
              No employee payroll records found for this month.
            </p>
          )}

        {employeeReports.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-sm text-zinc-500">
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Streams</th>
                  <th className="px-3 py-3 font-medium">Gross Payout</th>
                  <th className="px-3 py-3 font-medium">Claimed</th>
                  <th className="px-3 py-3 font-medium">Remaining</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {employeeReports.map((employee) => (
                  <tr
                    key={employee.employee}
                    className="border-b border-zinc-900"
                  >
                    <td className="px-3 py-4">
                      <p className="text-sm font-medium">
                        {shortenAddress(employee.employee)}
                      </p>

                      <p className="mt-1 break-all text-xs text-zinc-500">
                        {employee.employee}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-sm">
                      {employee.streamCount}
                    </td>

                    <td className="px-3 py-4 text-sm">
                      {formatTokenAmount(
                        BigInt(employee.grossPayout),
                      )}
                    </td>

                    <td className="px-3 py-4 text-sm text-green-400">
                      {formatTokenAmount(
                        BigInt(employee.totalClaimed),
                      )}
                    </td>

                    <td className="px-3 py-4 text-sm">
                      {formatTokenAmount(
                        BigInt(employee.remaining),
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <div className="space-y-1 text-xs">
                        <p className="text-green-400">
                          Completed: {employee.completed}
                        </p>

                        <p className="text-zinc-400">
                          Pending: {employee.pending}
                        </p>

                        <p className="text-red-400">
                          Canceled: {employee.canceled}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 p-4">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className={`mt-2 text-2xl font-semibold ${className}`}>
        {value}
      </p>
    </div>
  );
}
