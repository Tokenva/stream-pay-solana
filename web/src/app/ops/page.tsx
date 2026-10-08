"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

type ApplicationStatus =
    | "pending"
    | "approved"
    | "rejected";

type PilotApplication = {
    id: string;
    wallet: string;
    company_name: string;
    company_website: string;
    work_email: string;
    country: string;
    team_size: number;
    monthly_stablecoin_payroll_volume: string;
    primary_use_case: string;
    why_tokenva: string;
    status: ApplicationStatus;
    rejection_reason: string | null;
    company_id: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    created_at: string;
    updated_at: string;
    pilot_status:
    | "pending"
    | "approved"
    | "active"
    | "expired"
    | "rejected"
    | null;
};

export default function OpsPage() {
    const [authenticated, setAuthenticated] =
        useState<boolean | null>(null);

    const [operatorKey, setOperatorKey] =
        useState("");

    const [applications, setApplications] =
        useState<PilotApplication[]>([]);

    const [selectedId, setSelectedId] =
        useState<string | null>(null);

    const [statusFilter, setStatusFilter] =
        useState<
            "all" | ApplicationStatus
        >("pending");

    const [loading, setLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [rejectionReason, setRejectionReason] =
        useState("");

    const [pilotStart, setPilotStart] =
        useState("");

    const [pilotEnd, setPilotEnd] =
        useState("");

    const selectedApplication =
        useMemo(
            () =>
                applications.find(
                    (application) =>
                        application.id === selectedId,
                ) ?? null,
            [applications, selectedId],
        );

    async function checkSession() {
        try {
            const response = await fetch(
                "/api/ops/applications",
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            setAuthenticated(
                response.status !== 401,
            );
        } catch {
            setAuthenticated(false);
        }
    }

    async function login() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "/api/ops/login",
                {
                    method: "POST",
                    headers: {
                        "content-type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        key: operatorKey,
                    }),
                },
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Operator login failed",
                );
            }

            setOperatorKey("");
            setAuthenticated(true);

            await loadApplications();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Operator login failed",
            );
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await fetch("/api/ops/logout", {
            method: "POST",
        });

        setAuthenticated(false);
        setApplications([]);
        setSelectedId(null);
    }

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const query =
                statusFilter === "all"
                    ? ""
                    : `?status=${statusFilter}`;

            const response = await fetch(
                `/api/ops/applications${query}`,
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (response.status === 401) {
                setAuthenticated(false);
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Unable to load applications",
                );
            }

            setApplications(
                data.applications ?? [],
            );

            if (
                selectedId &&
                !(
                    data.applications ?? []
                ).some(
                    (application: PilotApplication) =>
                        application.id === selectedId,
                )
            ) {
                setSelectedId(null);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load applications",
            );
        } finally {
            setLoading(false);
        }
    }, [selectedId, statusFilter]);

    async function updateApplication(
        status: "approved" | "rejected",
    ) {
        if (!selectedApplication) {
            return;
        }

        if (
            status === "rejected" &&
            !rejectionReason.trim()
        ) {
            setError(
                "Rejection reason is required.",
            );
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/ops/applications/${selectedApplication.id}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "content-type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        status === "rejected"
                            ? {
                                status,
                                rejectionReason:
                                    rejectionReason.trim(),
                            }
                            : {
                                status,
                            },
                    ),
                },
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Unable to update application",
                );
            }

            setRejectionReason("");
            await loadApplications();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update application",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function activatePilot() {
        if (
            !selectedApplication?.company_id
        ) {
            setError(
                "This application does not have a company yet.",
            );
            return;
        }

        if (!pilotStart || !pilotEnd) {
            setError(
                "Pilot start and end are required.",
            );
            return;
        }

if (!pilotStart || !pilotEnd) {
    setError(
        "Pilot start and end are required.",
    );
    return;
}

const startDate =
    new Date(pilotStart);

const endDate =
    new Date(pilotEnd);

if (
    Number.isNaN(
        startDate.getTime(),
    ) ||
    Number.isNaN(
        endDate.getTime(),
    )
) {
    setError(
        "Please enter valid pilot start and end dates.",
    );
    return;
}

if (endDate <= startDate) {
    setError(
        "Pilot end must be after pilot start.",
    );
    return;
}

const start =
    startDate.toISOString();

const end =
    endDate.toISOString();

        setActionLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/ops/companies/${selectedApplication.company_id}/pilot`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "content-type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        status: "active",
                        pilotStart: start,
                        pilotEnd: end,
                    }),
                },
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Unable to activate pilot",
                );
            }

            await loadApplications();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to activate pilot",
            );
        } finally {
            setActionLoading(false);
        }
    }

    useEffect(() => {
        void checkSession();
    }, []);

    useEffect(() => {
        if (authenticated) {
            void loadApplications();
        }
    }, [authenticated, loadApplications]);

    if (authenticated === null) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">

                    <header className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                                TOKENVA
                            </p>

                            <p className="mt-2 text-sm font-medium text-white/70">
                                Operations
                            </p>
                        </div>

                        <div className="h-9 w-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                    </header>

                    <div className="flex flex-1 items-center justify-center py-20">
                        <section className="w-full max-w-3xl">

                            <div className="mb-8">
                                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />

                                <div className="mt-4 h-10 w-72 animate-pulse rounded-lg bg-white/10" />

                                <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-white/5" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
                                <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
                                <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
                            </div>

                            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                                <div className="flex items-center gap-3">
                                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white/50" />

                                    <p className="text-sm text-white/50">
                                        Loading Tokenva Ops
                                    </p>
                                </div>

                                <div className="mt-5 h-3 w-full animate-pulse rounded bg-white/5" />
                                <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-white/5" />
                                <div className="mt-3 h-3 w-3/5 animate-pulse rounded bg-white/5" />
                            </div>

                        </section>
                    </div>
                </div>
            </main>
        );
    }

    if (!authenticated) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
                    <div className="mb-8">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Tokenva
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold">
                            Operator access
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Review design partner applications
                            and manage pilot access.
                        </p>
                    </div>

                    <label className="block text-sm text-zinc-400">
                        Operator key
                    </label>

                    <input
                        type="password"
                        value={operatorKey}
                        onChange={(event) =>
                            setOperatorKey(
                                event.target.value,
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter"
                            ) {
                                void login();
                            }
                        }}
                        className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none focus:border-zinc-500"
                        placeholder="Enter operator key"
                    />

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={() => void login()}
                        disabled={
                            loading ||
                            !operatorKey
                        }
                        className="mt-5 cursor-pointer w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium hover:bg-zinc-800 disabled:opacity-40"
                    >
                        {loading
                            ? "Signing in..."
                            : "Enter Tokenva Ops"}
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
                <header className="flex flex-col gap-5 border-b border-zinc-800 pb-7 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Tokenva Ops
                        </p>

                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            Design Partner Pilot
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                            Review applications, approve
                            companies, and activate controlled
                            pilot access.
                        </p>
                    </div>

                    <button
                        onClick={() => void logout()}
                        className="rounded-xl cursor-pointer border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                        Sign out
                    </button>
                </header>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950">
                        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="font-medium">
                                    Applications
                                </h2>

                                <button
                                    onClick={() =>
                                        void loadApplications()
                                    }
                                    disabled={loading}
                                    className="text-xs  cursor-pointer text-zinc-500 hover:text-white disabled:opacity-40"
                                >
                                    Refresh
                                </button>
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                        | "all"
                                        | ApplicationStatus,
                                    )
                                }
                                className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm"
                            >
                                <option value="pending">
                                    Pending
                                </option>
                                <option value="approved">
                                    Approved
                                </option>
                                <option value="rejected">
                                    Rejected
                                </option>
                                <option value="all">
                                    All
                                </option>
                            </select>
                        </div>

                        <div className="divide-y divide-zinc-900">
                            {applications.length === 0 && (
                                <div className="p-6 text-sm text-zinc-600">
                                    No applications found.
                                </div>
                            )}

                            {applications.map(
                                (application) => (
                                    <button
                                        key={application.id}
                                        onClick={() =>
                                            setSelectedId(
                                                application.id,
                                            )
                                        }
                                        className={`w-full  cursor-pointer text-left p-5 hover:bg-zinc-900 ${selectedId ===
                                            application.id
                                            ? "bg-zinc-900"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {
                                                        application.company_name
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        application.work_email
                                                    }
                                                </p>
                                            </div>

                                            <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
                                                {
                                                    application.status
                                                }
                                            </span>
                                        </div>

                                        <p className="mt-3 text-xs text-zinc-600">
                                            {
                                                application.monthly_stablecoin_payroll_volume
                                            }
                                        </p>
                                    </button>
                                ),
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-zinc-950">
                        {!selectedApplication ? (
                            <div className="flex min-h-[500px] items-center justify-center p-8 text-center">
                                <div>
                                    <p className="text-lg text-zinc-400">
                                        Select an application
                                    </p>

                                    <p className="mt-2 text-sm text-zinc-600">
                                        Review applicant details and
                                        manage pilot access.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 lg:p-8">
                                <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
                                            Application
                                        </p>

                                        <h2 className="mt-2 text-3xl font-semibold">
                                            {
                                                selectedApplication.company_name
                                            }
                                        </h2>

                                        <p className="mt-2 text-sm text-zinc-500">
                                            {
                                                selectedApplication.work_email
                                            }
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs uppercase tracking-wider text-zinc-400">
                                        {
                                            selectedApplication.status
                                        }
                                    </span>
                                </div>

                                <div className="mt-7 grid gap-5 md:grid-cols-2">
                                    <Info
                                        label="Website"
                                        value={
                                            selectedApplication.company_website
                                        }
                                    />

                                    <Info
                                        label="Country"
                                        value={
                                            selectedApplication.country
                                        }
                                    />

                                    <Info
                                        label="Team size"
                                        value={String(
                                            selectedApplication.team_size,
                                        )}
                                    />

                                    <Info
                                        label="Payroll volume"
                                        value={
                                            selectedApplication.monthly_stablecoin_payroll_volume
                                        }
                                    />

                                    <Info
                                        label="Wallet"
                                        value={
                                            selectedApplication.wallet
                                        }
                                        full
                                    />

                                    <Info
                                        label="Application ID"
                                        value={
                                            selectedApplication.id
                                        }
                                        full
                                    />
                                </div>

                                <div className="mt-8 space-y-5">
                                    <TextBlock
                                        label="Primary use case"
                                        value={
                                            selectedApplication.primary_use_case
                                        }
                                    />

                                    <TextBlock
                                        label="Why Tokenva"
                                        value={
                                            selectedApplication.why_tokenva
                                        }
                                    />
                                </div>

                                {selectedApplication.rejection_reason && (
                                    <div className="mt-7 rounded-xl border border-red-900/40 bg-red-950/10 p-5">
                                        <p className="text-xs uppercase tracking-wider text-red-400">
                                            Rejection reason
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                                            {
                                                selectedApplication.rejection_reason
                                            }
                                        </p>
                                    </div>
                                )}

                                {selectedApplication.status ===
                                    "pending" && (
                                        <div className="mt-8 grid gap-5 border-t border-zinc-800 pt-7 lg:grid-cols-2">
                                            <div>
                                                <label className="text-xs uppercase tracking-wider text-zinc-600">
                                                    Rejection reason
                                                </label>

                                                <textarea
                                                    value={
                                                        rejectionReason
                                                    }
                                                    onChange={(event) =>
                                                        setRejectionReason(
                                                            event.target.value,
                                                        )
                                                    }
                                                    rows={4}
                                                    className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none focus:border-zinc-600"
                                                    placeholder="Required when rejecting"
                                                />
                                            </div>

                                            <div className="flex flex-col justify-end gap-3">
                                                <button
                                                    onClick={() =>
                                                        void updateApplication(
                                                            "approved",
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    className="rounded-xl  cursor-pointer border border-green-900/50 bg-green-950/20 px-4 py-3 text-sm font-medium text-green-300 hover:bg-green-950/40 disabled:opacity-40"
                                                >
                                                    {actionLoading
                                                        ? "Processing..."
                                                        : "Approve application"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        void updateApplication(
                                                            "rejected",
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ||
                                                        !rejectionReason.trim()
                                                    }
                                                    className="rounded-xl  cursor-pointer border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-950/40 disabled:opacity-40"
                                                >
                                                    Reject application
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                {selectedApplication.company_id &&
                                    selectedApplication.status === "approved" && (
                                        <div className="mt-8 border-t border-zinc-800 pt-7">
                                            <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
                                                Pilot activation
                                            </p>

                                            <h3 className="mt-2 text-xl font-medium">
                                                Start the design partner pilot
                                            </h3>

                                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="text-xs text-zinc-500">
                                                        Pilot start
                                                    </label>

                                                    <input
                                                        type="datetime-local"
                                                        value={
                                                            pilotStart
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setPilotStart(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-zinc-500">
                                                        Pilot end
                                                    </label>

                                                    <input
                                                        type="datetime-local"
                                                        value={
                                                            pilotEnd
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setPilotEnd(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (
                                                        selectedApplication.status ===
                                                        "approved"
                                                    ) {
                                                        void activatePilot();
                                                    }
                                                }}
                                                disabled={
                                                    actionLoading ||
                                                    selectedApplication.pilot_status ===
                                                    "active" ||
                                                    !pilotStart ||
                                                    !pilotEnd
                                                }
                                                className="mt-5 cursor-pointer rounded-xl border border-green-900/50 bg-green-950/20 px-5 py-3 text-sm font-medium text-green-300 hover:bg-green-950/40 disabled:opacity-40"
                                            >
                                                {actionLoading
                                                    ? "Activating..."
                                                    : selectedApplication.pilot_status ===
                                                        "active"
                                                        ? "Pilot activated"
                                                        : "Activate pilot"}
                                            </button>
                                        </div>
                                    )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

function Info({
    label,
    value,
    full = false,
}: {
    label: string;
    value: string;
    full?: boolean;
}) {
    return (
        <div
            className={
                full
                    ? "md:col-span-2"
                    : ""
            }
        >
            <p className="text-xs uppercase tracking-wider text-zinc-600">
                {label}
            </p>

            <p className="mt-2 break-all text-sm text-zinc-300">
                {value}
            </p>
        </div>
    );
}

function TextBlock({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
                {label}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {value}
            </p>
        </div>
    );
}