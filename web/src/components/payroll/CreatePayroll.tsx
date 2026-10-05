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
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div>
        <p className="text-sm text-zinc-400">
          Payment Stream
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Create Payroll
        </h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={payrollTemplate}
          onChange={(event) => {
            const value = event.target.value;
            setPayrollTemplate(value);
            onTemplateChange(value);
          }}
          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
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

        <select
          value={payrollType}
          onChange={(event) =>
            setPayrollType(event.target.value)
          }
          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
        >
          <option value="Salary">Salary</option>
          <option value="Contractor">Contractor</option>
          <option value="Bonus">Bonus</option>
        </select>

        <input
          value={employeeAddress}
          onChange={(event) =>
            setEmployeeAddress(event.target.value)
          }
          placeholder="Employee wallet address"
          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
        />

        <input
          value={streamId}
          onChange={(event) =>
            setStreamId(Number(event.target.value))
          }
          type="number"
          min="1"
          placeholder="Stream ID"
          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
        />

        <input
          value={streamAmount}
          onChange={(event) =>
            setStreamAmount(event.target.value)
          }
          inputMode="decimal"
          placeholder="Total amount"
          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
        />

        {mounted && (
          <>
            <input
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              type="datetime-local"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />

            <input
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              type="datetime-local"
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
            />
          </>
        )}
      </div>

      <button
        type="button"
        disabled={
          streamLoading ||
          !canCreatePayroll ||
          !vaultExists ||
          !employeeWalletValid ||
          !streamAmount
        }
        onClick={onCreate}
        className="mt-5 cursor-pointer rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
      >
        {streamLoading
          ? "Creating..."
          : `Create ${payrollType} Payroll`}
      </button>
    </section>
  );
}
