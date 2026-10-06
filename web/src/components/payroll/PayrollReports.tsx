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
    <section className="mt-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Finance & Operations
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Reports
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Review payroll performance, treasury obligations,
          employee-level payouts, and on-chain reconciliation.
        </p>
      </div>

      {/* Payroll overview */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Payroll
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Monthly payroll overview
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Current payroll activity reported from indexed streams.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPayrollRefresh}
              disabled={payrollReportLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {payrollReportLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => onExport("payroll")}
              disabled={exportLoading !== null}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exportLoading === "payroll"
                ? "Exporting..."
                : "Export Payroll"}
            </button>
          </div>
        </div>

        {payrollReportError && (
          <ErrorMessage message={payrollReportError} />
        )}

        {payrollReportLoading && !payrollReport && (
          <LoadingMessage message="Loading payroll report..." />
        )}

        {payrollReport && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Metric
              label="Employees"
              value={payrollReport.employees}
            />

            <Metric
              label="Gross payroll"
              value={formatTokenAmount(
                BigInt(payrollReport.grossPayout),
              )}
              emphasis
            />

            <Metric
              label="Claimed"
              value={formatTokenAmount(
                BigInt(payrollReport.totalClaimed),
              )}
              className="text-green-400"
            />

            <Metric
              label="Completed"
              value={payrollReport.completed}
              className="text-green-400"
            />

            <Metric
              label="Pending"
              value={payrollReport.pending}
            />

            <Metric
              label="Canceled"
              value={payrollReport.canceled}
              className="text-red-400"
            />
          </div>
        )}
      </section>

      {/* Treasury */}
      <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Treasury
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Payroll obligations
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Current-month obligations derived from indexed streams.
            </p>
          </div>

          <button
            type="button"
            onClick={onTreasuryRefresh}
            disabled={treasuryReportLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {treasuryReportLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {treasuryReportError && (
          <ErrorMessage message={treasuryReportError} />
        )}

        {treasuryReportLoading && !treasuryReport && (
          <LoadingMessage message="Loading treasury report..." />
        )}

        {treasuryReport && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Gross payroll"
                value={formatTokenAmount(
                  BigInt(treasuryReport.grossPayout),
                )}
                emphasis
              />

              <Metric
                label="Claimed"
                value={formatTokenAmount(
                  BigInt(treasuryReport.totalClaimed),
                )}
                className="text-green-400"
              />

              <Metric
                label="Outstanding"
                value={formatTokenAmount(
                  BigInt(treasuryReport.outstanding),
                )}
              />

              <Metric
                label="Streams"
                value={treasuryReport.streamCount}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatusMetric
                label="Active"
                value={treasuryReport.active}
              />

              <StatusMetric
                label="Completed"
                value={treasuryReport.completed}
                className="text-green-400"
              />

              <StatusMetric
                label="Canceled"
                value={treasuryReport.canceled}
                className="text-red-400"
              />
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-600">
              Treasury cash-in/cash-out amounts are not reported
              here because the current transaction record stores
              status and metadata, but not transaction amounts.
            </p>
          </>
        )}
      </section>

      {/* Employee report */}
      <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Workforce
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Employee payroll
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Monthly payroll totals grouped by employee wallet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEmployeeRefresh}
              disabled={employeeReportLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {employeeReportLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => onExport("employees")}
              disabled={exportLoading !== null}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exportLoading === "employees"
                ? "Exporting..."
                : "Export Employees"}
            </button>
          </div>
        </div>

        {employeeReportError && (
          <ErrorMessage message={employeeReportError} />
        )}

        {employeeReportLoading &&
          employeeReports.length === 0 && (
            <LoadingMessage message="Loading employee reports..." />
          )}

        {!employeeReportLoading &&
          !employeeReportError &&
          employeeReports.length === 0 && (
            <EmptyMessage message="No employee payroll records found for this month." />
          )}

        {employeeReports.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-zinc-900/60">
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-medium">
                    Employee
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Streams
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Gross
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Claimed
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Remaining
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {employeeReports.map((employee) => (
                  <tr
                    key={employee.employee}
                    className="border-b border-zinc-900 last:border-b-0 hover:bg-zinc-900/30"
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white">
                        {shortenAddress(employee.employee)}
                      </p>

                      <p className="mt-1 max-w-[240px] truncate text-xs text-zinc-600">
                        {employee.employee}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {employee.streamCount}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {formatTokenAmount(
                        BigInt(employee.grossPayout),
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-green-400">
                      {formatTokenAmount(
                        BigInt(employee.totalClaimed),
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {formatTokenAmount(
                        BigInt(employee.remaining),
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <StatusPill
                          label={`Completed ${employee.completed}`}
                          tone="success"
                        />

                        <StatusPill
                          label={`Pending ${employee.pending}`}
                          tone="neutral"
                        />

                        <StatusPill
                          label={`Canceled ${employee.canceled}`}
                          tone="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Exports */}
      <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Data export
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            Download reports
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Export the currently available finance data for
            external analysis.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ExportButton
            label="Payroll CSV"
            loading={exportLoading === "payroll"}
            disabled={exportLoading !== null}
            onClick={() => onExport("payroll")}
          />

          <ExportButton
            label="Employee CSV"
            loading={exportLoading === "employees"}
            disabled={exportLoading !== null}
            onClick={() => onExport("employees")}
          />

          <ExportButton
            label="Transactions CSV"
            loading={exportLoading === "transactions"}
            disabled={exportLoading !== null}
            onClick={() => onExport("transactions")}
          />
        </div>
      </section>

      {/* Reconciliation */}
      <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Operations
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Stream reconciliation
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Compare on-chain stream accounts with indexed database records.
            </p>
          </div>

          <button
            type="button"
            onClick={onReconciliation}
            disabled={reconciliationLoading}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {reconciliationLoading
              ? "Checking..."
              : "Run reconciliation"}
          </button>
        </div>

        {reconciliationError && (
          <ErrorMessage message={reconciliationError} />
        )}

        {reconciliationLoading && !reconciliationReport && (
          <LoadingMessage message="Running reconciliation..." />
        )}

        {reconciliationReport && (
          <>
            <div
              className={`mt-6 rounded-xl border p-4 ${
                reconciliationReport.healthy
                  ? "border-green-900/70 bg-green-950/20"
                  : "border-red-900/70 bg-red-950/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    reconciliationReport.healthy
                      ? "bg-green-400"
                      : "bg-red-400"
                  }`}
                />

                <div>
                  <p
                    className={`text-sm font-semibold ${
                      reconciliationReport.healthy
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {reconciliationReport.healthy
                      ? "System synchronized"
                      : "Differences require investigation"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {reconciliationReport.healthy
                      ? "Indexed stream records match the on-chain accounts checked by reconciliation."
                      : "One or more differences were detected between indexed records and on-chain stream accounts."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                label="Missing / stale"
                value={
                  reconciliationReport.missingFromDb +
                  reconciliationReport.staleInDb
                }
              />
            </div>

            {reconciliationReport.details.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-zinc-300">
                  Investigation details
                </p>

                <div className="space-y-2">
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
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}

function Metric({
  label,
  value,
  className = "",
  emphasis = false,
}: {
  label: string;
  value: string | number;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-2 font-semibold ${
          emphasis ? "text-xl" : "text-2xl"
        } ${className || "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusMetric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${
          className || "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "neutral" | "danger";
}) {
  const classes = {
    success:
      "border-green-900/70 bg-green-950/30 text-green-400",
    neutral:
      "border-zinc-800 bg-zinc-900 text-zinc-400",
    danger:
      "border-red-900/70 bg-red-950/30 text-red-400",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 ${classes[tone]}`}
    >
      {label}
    </span>
  );
}

function ExportButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-left transition hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-sm font-medium text-zinc-200">
        {label}
      </span>

      <span className="text-xs text-zinc-500">
        {loading ? "Exporting..." : "Download"}
      </span>
    </button>
  );
}

function LoadingMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-black/20 p-4">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-red-900/70 bg-red-950/20 p-4">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

function EmptyMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}