type CompanyOverviewProps = {
  treasuryBalance: string;
  payrollThisMonth: string;
  payrollLoading: boolean;
  activeStreamCount: number;
  employeeCount: number;
  hasRecentActivity: boolean;
  currentRole: string;
};

function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`workspace-metric ${
        emphasis ? "workspace-metric-primary" : ""
      }`}
    >
      <div className="workspace-metric-top">
        <span>{label}</span>
      </div>

      <p className="workspace-metric-value">
        {value}
      </p>

      {detail && (
        <p className="workspace-metric-detail">
          {detail}
        </p>
      )}
    </div>
  );
}

export default function CompanyOverview({
  treasuryBalance,
  payrollThisMonth,
  payrollLoading,
  activeStreamCount,
  employeeCount,
  hasRecentActivity,
  currentRole,
}: CompanyOverviewProps) {
  const payrollValue = payrollThisMonth
    ? payrollThisMonth
    : payrollLoading
      ? "Loading..."
      : "0";

  return (
    <section className="workspace-overview">
      <div className="workspace-overview-header">
        <div>
          <p className="demo-section-label">
            Workspace Overview
          </p>

          <h2 className="workspace-overview-title">
            Company Overview
          </h2>

          <p className="workspace-overview-description">
            A live snapshot of your payroll operations, treasury,
            payment streams, and team activity.
          </p>
        </div>

        <div className="workspace-role">
          <span className="workspace-role-label">
            Current role
          </span>

          <span className="workspace-role-value">
            {currentRole}
          </span>
        </div>
      </div>

      <div className="workspace-metrics">
        <MetricCard
          label="Treasury Balance"
          value={treasuryBalance}
          detail="Available payroll liquidity"
          emphasis
        />

        <MetricCard
          label="Payroll This Month"
          value={payrollValue}
          detail="Gross scheduled payout"
        />

        <MetricCard
          label="Active Streams"
          value={activeStreamCount.toString()}
          detail="Currently running payment streams"
        />

        <MetricCard
          label="Employees"
          value={employeeCount.toString()}
          detail="Employees represented in streams"
        />
      </div>

      <div className="workspace-status-grid">
        <div className="workspace-status-card">
          <div className="workspace-status-icon workspace-status-icon-live">
            <span />
          </div>

          <div>
            <p className="workspace-status-title">
              Payroll infrastructure
            </p>

            <p className="workspace-status-description">
              Your Tokenva workspace is ready for payroll operations.
            </p>
          </div>
        </div>

        <div className="workspace-status-card">
          <div className="workspace-status-icon">
            <span />
          </div>

          <div>
            <p className="workspace-status-title">
              Recent activity
            </p>

            <p className="workspace-status-description">
              {hasRecentActivity
                ? "Recent payment-stream activity is available."
                : "No payment-stream activity has been recorded yet."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}