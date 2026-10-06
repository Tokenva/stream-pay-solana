"use client";

type CreatePayrollProps = {
  payrollTemplate: string;
  setPayrollTemplate: (value: string) => void;
  payrollType: string;
  setPayrollType: (value: string) => void;
  employeeAddress: string;
  setEmployeeAddress: (value: string) => void;
  streamId: number;
  setStreamId: (value: number) => void;
  streamAmount: string;
  setStreamAmount: (value: string) => void;
  mounted: boolean;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  streamLoading: boolean;
  canCreatePayroll: boolean;
  vaultExists: boolean;
  employeeWalletValid: boolean;
  onTemplateChange: (value: string) => void;
  onCreate: () => void;
};

export default function CreatePayroll({
  payrollTemplate,
  setPayrollTemplate,
  payrollType,
  setPayrollType,
  employeeAddress,
  setEmployeeAddress,
  streamId,
  setStreamId,
  streamAmount,
  setStreamAmount,
  mounted,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  streamLoading,
  canCreatePayroll,
  vaultExists,
  employeeWalletValid,
  onTemplateChange,
  onCreate,
}: CreatePayrollProps) {
  const ready =
    canCreatePayroll &&
    vaultExists &&
    employeeWalletValid &&
    !!streamAmount;

  return (
    <section
      id="payroll"
      className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
          03
        </span>

        <div>
          <p className="text-sm text-zinc-400">
            Payroll
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Create a payment stream
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Choose a payroll template, select the employee,
            define the stream amount and schedule, then create
            the payroll stream.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            1. Payroll template
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="payroll-template"
                className="text-xs text-zinc-500"
              >
                Template
              </label>

              <select
                id="payroll-template"
                value={payrollTemplate}
                onChange={(event) => {
                  const value = event.target.value;

                  setPayrollTemplate(value);
                  onTemplateChange(value);
                }}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
              >
                <option value="Monthly Salary">
                  Monthly Salary Template
                </option>

                <option value="Contractor">
                  Contractor Template
                </option>

                <option value="Bonus">
                  Bonus Template
                </option>

                <option value="Custom">
                  Custom Payroll
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="payroll-type"
                className="text-xs text-zinc-500"
              >
                Payroll type
              </label>

              <select
                id="payroll-type"
                value={payrollType}
                onChange={(event) =>
                  setPayrollType(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
              >
                <option value="Salary">
                  Salary
                </option>

                <option value="Contractor">
                  Contractor
                </option>

                <option value="Bonus">
                  Bonus
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            2. Employee
          </p>

          <div className="mt-4">
            <label
              htmlFor="payroll-employee"
              className="text-xs text-zinc-500"
            >
              Employee wallet
            </label>

            <input
              id="payroll-employee"
              value={employeeAddress}
              onChange={(event) =>
                setEmployeeAddress(event.target.value)
              }
              placeholder="Employee wallet address"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
            />

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  employeeWalletValid
                    ? "bg-green-400"
                    : "bg-zinc-700"
                }`}
              />

              <span
                className={`text-xs ${
                  employeeWalletValid
                    ? "text-green-400"
                    : "text-zinc-500"
                }`}
              >
                {employeeWalletValid
                  ? "Verified employee wallet"
                  : "Verify the employee wallet before creating payroll"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            3. Payment details
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="stream-amount"
                className="text-xs text-zinc-500"
              >
                Total stream amount
              </label>

              <input
                id="stream-amount"
                value={streamAmount}
                onChange={(event) =>
                  setStreamAmount(event.target.value)
                }
                inputMode="decimal"
                placeholder="500"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="stream-id"
                className="text-xs text-zinc-500"
              >
                Stream ID
              </label>

              <input
                id="stream-id"
                value={streamId}
                onChange={(event) =>
                  setStreamId(
                    Number(event.target.value),
                  )
                }
                type="number"
                min="1"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            4. Schedule
          </p>

          {mounted ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="stream-start"
                  className="text-xs text-zinc-500"
                >
                  Start time
                </label>

                <input
                  id="stream-start"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="stream-end"
                  className="text-xs text-zinc-500"
                >
                  End time
                </label>

                <input
                  id="stream-end"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value,
                    )
                  }
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              Loading schedule...
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Ready to create payroll?
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              The stream requires a ready vault, valid employee
              wallet, amount, and payroll permission.
            </p>
          </div>

          <button
            type="button"
            disabled={
              streamLoading || !ready
            }
            onClick={onCreate}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {streamLoading
              ? "Creating..."
              : `Create ${payrollType} Payroll`}
          </button>
        </div>
      </div>
    </section>
  );
}