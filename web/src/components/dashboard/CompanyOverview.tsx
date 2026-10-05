type CompanyOverviewProps = {
  treasuryBalance: string;
  payrollThisMonth: string;
  payrollLoading: boolean;
  activeStreamCount: number;
  employeeCount: number;
  hasRecentActivity: boolean;
  currentRole: string;
};

export default function CompanyOverview({
  treasuryBalance,
  payrollThisMonth,
  payrollLoading,
  activeStreamCount,
  employeeCount,
  hasRecentActivity,
  currentRole,
}: CompanyOverviewProps) {
  const cards = [
    {
      label: "Treasury Balance",
      value: treasuryBalance,
    },
    {
      label: "Payroll This Month",
      value: payrollThisMonth
        ? payrollThisMonth
        : payrollLoading
          ? "Loading..."
          : "0",
    },
    {
      label: "Active Streams",
      value: activeStreamCount.toString(),
    },
    {
      label: "Pending Actions",
      value: "—",
    },
    {
      label: "Employees",
      value: employeeCount.toString(),
    },
    {
      label: "Recent Activity",
      value: hasRecentActivity
        ? "Available"
        : "None yet",
    },
    {
      label: "Your Role",
      value: currentRole,
    },
  ];

  return (
    <section className="mt-10">
      <div className="mb-4">
        <p className="demo-section-label">
          Payroll Dashboard
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Company Overview
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
          >
            <p className="text-sm text-zinc-500">
              {card.label}
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
