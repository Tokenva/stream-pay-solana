"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    getSession,
    logout,
} from "@/lib/auth";
import { PublicKey } from "@solana/web3.js";
import {
    getCompanyAccess,
    type CompanyAccess,
} from "@/lib/company";

import CompanyOnboarding from "@/components/company/CompanyOnboarding";
import ApplicationStatus from "@/components/company/ApplicationStatus";
import PilotStatus from "@/components/company/PilotStatus";

import WalletButton from "@/components/WalletButton";
import OperationalDashboard from "@/components/OperationalDashboard";

import CompanyOverview from "@/components/dashboard/CompanyOverview";

import CompanySetup from "@/components/payroll/CompanySetup";
import EmployeeDirectory from "@/components/payroll/EmployeeDirectory";
import TreasuryFunding from "@/components/payroll/TreasuryFunding";
import CreatePayroll from "@/components/payroll/CreatePayroll";
import ActiveStream from "@/components/payroll/ActiveStream";
import PayrollReports from "@/components/payroll/PayrollReports";

import ActivityStats from "@/components/activity/ActivityStats";
import ActivityHistory from "@/components/activity/ActivityHistory";

import { useOrganization } from "@/hooks/useOrganization";
import { useVault } from "@/hooks/useVault";
import { useDeposit } from "@/hooks/useDeposit";
import { useStream } from "@/hooks/useStream";
import { useStreamActions } from "@/hooks/useStreamActions";
import { useIndexedStreams } from "@/hooks/useIndexedStreams";

const EMPTY_MINT = "";

const DECIMALS = 6;
const BASE_UNITS = BigInt(1_000_000);
const ZERO = BigInt(0);

function shortenAddress(address: string) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function toBaseUnits(value: string) {
    const [whole, fraction = ""] =
        value.trim().split(".");

    if (!/^\d+$/.test(whole)) {
        throw new Error("Invalid token amount");
    }

    const padded = fraction
        .padEnd(DECIMALS, "0")
        .slice(0, DECIMALS);

    return (
        BigInt(whole) * BASE_UNITS +
        BigInt(padded || "0")
    ).toString();
}

function formatDateTimeLocal(date: Date) {
    return `${date
        .getFullYear()
        .toString()
        .padStart(4, "0")}-${(
            date.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}-${date
                .getDate()
                .toString()
                .padStart(2, "0")}T${date
                    .getHours()
                    .toString()
                    .padStart(2, "0")}:${date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`;
}

function formatTokenAmount(raw: bigint) {
    const whole = raw / BASE_UNITS;
    const fraction = raw % BASE_UNITS;

    if (fraction === ZERO) {
        return whole.toString();
    }

    return `${whole}.${fraction
        .toString()
        .padStart(6, "0")
        .replace(/0+$/, "")}`;
}

function ProtectedHome() {
    const { publicKey } = useWallet();

    const [mint, setMint] =
        useState(EMPTY_MINT);

    useEffect(() => {
        let cancelled = false;

        async function loadConfig() {
            try {
                const response =
                    await fetch("/api/config", {
                        cache: "no-store",
                    });

                if (!response.ok) {
                    throw new Error(
                        "Failed to load application configuration",
                    );
                }

                const data =
                    (await response.json()) as {
                        mint: string;
                    };

                if (!cancelled) {
                    setMint(data.mint);
                }
            } catch (err) {
                if (!cancelled) {
                    setActionError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load application configuration",
                    );
                }
            }
        }

        void loadConfig();

        return () => {
            cancelled = true;
        };
    }, []);

    const [depositAmount, setDepositAmount] =
        useState("");

    const [employeeAddress, setEmployeeAddress] =
        useState("");

    const [streamAmount, setStreamAmount] =
        useState("500");

    const [payrollType, setPayrollType] =
        useState("Salary");

    const [payrollTemplate, setPayrollTemplate] =
        useState("Monthly Salary");

    const [streamId, setStreamId] =
        useState(1);

    const [startTime, setStartTime] =
        useState("");

    const [endTime, setEndTime] =
        useState("");

    const [message, setMessage] =
        useState<string | null>(null);

    const [actionError, setActionError] =
        useState<string | null>(null);

    const [mounted, setMounted] =
        useState(false);

    const [onboardingLoading, setOnboardingLoading] =
        useState(false);

    const [employeeWalletValid, setEmployeeWalletValid] =
        useState(false);

    const [payrollReport, setPayrollReport] =
        useState<{
            month: string;
            employees: number;
            grossPayout: string;
            totalClaimed: string;
            completed: number;
            pending: number;
            canceled: number;
            streamCount: number;
        } | null>(null);

    const [payrollReportLoading, setPayrollReportLoading] =
        useState(false);

    const [payrollReportError, setPayrollReportError] =
        useState<string | null>(null);

    const [employeeReports, setEmployeeReports] =
        useState<
            {
                employee: string;
                streamCount: number;
                grossPayout: string;
                totalClaimed: string;
                remaining: string;
                completed: number;
                pending: number;
                canceled: number;
            }[]
        >([]);

    const [employeeReportLoading, setEmployeeReportLoading] =
        useState(false);

    const [employeeReportError, setEmployeeReportError] =
        useState<string | null>(null);

    const [treasuryReport, setTreasuryReport] =
        useState<{
            month: string;
            streamCount: number;
            grossPayout: string;
            totalClaimed: string;
            outstanding: string;
            active: number;
            completed: number;
            canceled: number;
            transactions: Record<string, number>;
        } | null>(null);

    const [treasuryReportLoading, setTreasuryReportLoading] =
        useState(false);

    const [treasuryReportError, setTreasuryReportError] =
        useState<string | null>(null);

    const [reconciliationReport, setReconciliationReport] =
        useState<{
            checked: number;
            databaseStreams: number;
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
        } | null>(null);

    const [
        reconciliationLoading,
        setReconciliationLoading,
    ] = useState(false);

    const [
        reconciliationError,
        setReconciliationError,
    ] = useState<string | null>(null);

    const [exportLoading, setExportLoading] =
        useState<string | null>(null);

    useEffect(() => {
        setMounted(true);

        const now = Math.floor(
            Date.now() / 1000,
        );

        const start = new Date(
            (now - 3600) * 1000,
        );

        const end = new Date(
            (now + 30 * 24 * 3600) * 1000,
        );

        setStartTime(
            formatDateTimeLocal(start),
        );

        setEndTime(
            formatDateTimeLocal(end),
        );
    }, []);

    const {
        organization,
        organizationRoles,
        rolesExists,
        exists: organizationExists,
        createOrganization,
        initializeOrganizationRoles,
    } = useOrganization();

    const {
        vault,
        exists: vaultExists,
        balance: vaultBalance,
        refresh: refreshVault,
        createVault,
    } = useVault(mint);

    const {
        tokenAccount,
        tokenBalance,
        deposit,
        loading: depositLoading,
    } = useDeposit(
        mint,
        refreshVault,
    );

    const {
        stream,
        streamEscrow,
        data: streamData,
        claimable,
        loading: streamLoading,
        error: streamError,
        createStream,
        claim,
    } = useStream(
        mint,
        streamId,
        employeeAddress,
    );

    const {
        loading: actionLoading,
        error: actionErrorStream,
        topUp,
        cancel,
    } = useStreamActions(
        mint,
        streamId,
        employeeAddress,
        async () => {
            await refreshVault();
        },
    );

    const {
        streams: indexedStreams,
        loading: indexedStreamsLoading,
        error: indexedStreamsError,
        refresh: refreshIndexedStreams,
    } = useIndexedStreams(
        publicKey?.toBase58(),
    );

    async function loadPayrollReport() {
        try {
            setPayrollReportLoading(true);
            setPayrollReportError(null);

            const month = new Date()
                .toISOString()
                .slice(0, 7);

            const response = await fetch(
                `/api/backend/api/reports/payroll?month=${month}`,
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load payroll report",
                );
            }

            const data = await response.json();

            setPayrollReport(data);
        } catch (err) {
            setPayrollReportError(
                err instanceof Error
                    ? err.message
                    : "Failed to load payroll report",
            );
        } finally {
            setPayrollReportLoading(false);
        }
    }

    useEffect(() => {
        void loadPayrollReport();
    }, []);

    async function loadEmployeeReports() {
        try {
            setEmployeeReportLoading(true);
            setEmployeeReportError(null);

            const month = new Date()
                .toISOString()
                .slice(0, 7);

            const response = await fetch(
                `/api/backend/api/reports/employees?month=${month}`,
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load employee reports",
                );
            }

            const data = await response.json();

            setEmployeeReports(
                Array.isArray(data.employees)
                    ? data.employees
                    : [],
            );
        } catch (err) {
            setEmployeeReportError(
                err instanceof Error
                    ? err.message
                    : "Failed to load employee reports",
            );
        } finally {
            setEmployeeReportLoading(false);
        }
    }

    useEffect(() => {
        void loadEmployeeReports();
    }, []);

    async function loadTreasuryReport() {
        try {
            setTreasuryReportLoading(true);
            setTreasuryReportError(null);

            const month = new Date()
                .toISOString()
                .slice(0, 7);

            const response = await fetch(
                `/api/backend/api/reports/treasury?month=${month}`,
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load treasury report",
                );
            }

            const data =
                await response.json();

            setTreasuryReport(data);
        } catch (err) {
            setTreasuryReportError(
                err instanceof Error
                    ? err.message
                    : "Failed to load treasury report",
            );
        } finally {
            setTreasuryReportLoading(false);
        }
    }

    useEffect(() => {
        void loadTreasuryReport();
    }, []);

    async function loadReconciliationReport() {
        try {
            setReconciliationLoading(true);
            setReconciliationError(null);

            const response = await fetch(
                "/api/backend/api/reports/reconciliation",
                {
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load reconciliation report",
                );
            }

            const data =
                await response.json();

            setReconciliationReport(data);
        } catch (err) {
            setReconciliationError(
                err instanceof Error
                    ? err.message
                    : "Failed to load reconciliation report",
            );
        } finally {
            setReconciliationLoading(false);
        }
    }

    useEffect(() => {
        void loadReconciliationReport();
    }, []);

    async function downloadReportCsv(
        type:
            | "payroll"
            | "employees"
            | "transactions",
    ) {
        try {
            setExportLoading(type);

            const month = new Date()
                .toISOString()
                .slice(0, 7);

            const url =
                type === "transactions"
                    ? "/api/backend/api/reports/transactions.csv"
                    : `/api/backend/api/reports/${type}.csv?month=${month}`;

            const response =
                await fetch(url, {
                    credentials: "include",
                });

            if (!response.ok) {
                throw new Error(
                    `Failed to export ${type} CSV`,
                );
            }

            const blob =
                await response.blob();

            const downloadUrl =
                URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = downloadUrl;

            anchor.download =
                `tokenva-${type}-${month}.csv`;

            document.body.appendChild(
                anchor,
            );

            anchor.click();

            anchor.remove();

            URL.revokeObjectURL(
                downloadUrl,
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "CSV export failed",
            );
        } finally {
            setExportLoading(null);
        }
    }

    async function handleCompanySetup() {
        try {
            setMessage(null);
            setActionError(null);
            setOnboardingLoading(true);

            if (!publicKey) {
                throw new Error(
                    "Connect your treasury wallet first",
                );
            }

            if (!organizationExists) {
                await createOrganization();
            }

            if (!vaultExists) {
                await createVault();
            }

            if (!rolesExists) {
                await initializeOrganizationRoles(
                    publicKey,
                    publicKey,
                    publicKey,
                    publicKey,
                );
            }

            await refreshVault();

            setMessage(
                "Company setup complete",
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Company setup failed",
            );
        } finally {
            setOnboardingLoading(false);
        }
    }

    function handleVerifyEmployeeWallet() {
        try {
            const address =
                employeeAddress.trim();

            if (!address) {
                throw new Error(
                    "Enter the employee wallet address",
                );
            }

            const normalized =
                new PublicKey(address).toBase58();

            setEmployeeAddress(normalized);
            setEmployeeWalletValid(true);
            setMessage(
                "Employee wallet address is valid",
            );
            setActionError(null);
        } catch (err) {
            setEmployeeWalletValid(false);
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Invalid employee wallet address",
            );
        }
    }

    async function handleDeposit() {
        try {
            setMessage(null);
            setActionError(null);

            const signature =
                await deposit(
                    depositAmount,
                );

            setDepositAmount("");

            setMessage(
                `Deposit successful: ${signature.slice(
                    0,
                    8,
                )}...`,
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Deposit failed",
            );
        }
    }

    async function handleTopUp() {
        try {
            setMessage(null);
            setActionError(null);

            const rawAmount =
                toBaseUnits("100");

            const signature =
                await topUp(rawAmount);

            setMessage(
                `Stream topped up: ${signature.slice(
                    0,
                    8,
                )}...`,
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Top-up failed",
            );
        }
    }

    async function handleCancel() {
        try {
            setMessage(null);
            setActionError(null);

            const signature =
                await cancel();

            setMessage(
                `Stream canceled: ${signature.slice(
                    0,
                    8,
                )}...`,
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Top-up failed",
            );
        }
    }

    function applyPayrollTemplate(
        template: string,
    ) {
        if (template === "Custom") {
            return;
        }

        const start = new Date(
            Date.now() + 5 * 60 * 1000,
        );

        const days =
            template === "Bonus"
                ? 7
                : 30;

        const amount =
            template === "Bonus"
                ? "100"
                : "500";

        setPayrollType(
            template === "Monthly Salary"
                ? "Salary"
                : template,
        );

        setStreamAmount(amount);

        setStartTime(
            formatDateTimeLocal(start),
        );

        setEndTime(
            formatDateTimeLocal(
                new Date(
                    start.getTime() +
                    days *
                    24 *
                    60 *
                    60 *
                    1000,
                ),
            ),
        );
    }

    async function handleCreateStream() {
        try {
            setMessage(null);
            setActionError(null);

            if (!startTime || !endTime) {
                throw new Error(
                    "Choose stream start and end times",
                );
            }

            const start = Math.floor(
                new Date(startTime).getTime() /
                1000,
            );

            const end = Math.floor(
                new Date(endTime).getTime() /
                1000,
            );

            const rawAmount =
                toBaseUnits(streamAmount);

            const result =
                await createStream(
                    employeeAddress,
                    rawAmount,
                    start,
                    end,
                );

            await refreshVault();

            setMessage(
                `${payrollType} payroll created: ${shortenAddress(
                    result.stream.toBase58(),
                )}`,
            );
        } catch (err) {
            console.error(
                "CREATE STREAM ERROR:",
                err,
            );

            setActionError(
                err instanceof Error
                    ? err.message
                    : "Create Stream failed",
            );
        }
    }

    async function handleClaim() {
        try {
            setMessage(null);
            setActionError(null);

            const signature =
                await claim();

            setMessage(
                `Claim successful: ${signature.slice(
                    0,
                    8,
                )}...`,
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Claim failed",
            );
        }
    }

    function handleSelectEmployee(
        address: string,
    ) {
        setEmployeeAddress(address);
        setEmployeeWalletValid(true);
        setMessage(
            `Selected employee ${shortenAddress(
                address,
            )}`,
        );
        setActionError(null);
    }

    const earnedDisplay =
        formatTokenAmount(claimable);

    const activeStreamCount =
        indexedStreams.filter(
            (item) => !item.canceled,
        ).length;

    const employeeCount =
        new Set(
            indexedStreams.map(
                (item) => item.employee,
            ),
        ).size;

    const employeeDirectory =
        Array.from(
            new Set(
                indexedStreams.map(
                    (item) => item.employee,
                ),
            ),
        ).map((employee) => ({
            address: employee,
            totalStreams:
                indexedStreams.filter(
                    (item) =>
                        item.employee === employee,
                ).length,
            activeStreams:
                indexedStreams.filter(
                    (item) =>
                        item.employee === employee &&
                        !item.canceled,
                ).length,
        }));

    const isOwner =
        organizationExists &&
        !!publicKey;

    const currentRole =
        isOwner
            ? "Owner"
            : rolesExists &&
                organizationRoles &&
                publicKey
                ? publicKey.equals(
                    organizationRoles.admin,
                )
                    ? "Admin"
                    : publicKey.equals(
                        organizationRoles.finance,
                    )
                        ? "Finance"
                        : publicKey.equals(
                            organizationRoles.approver,
                        )
                            ? "Approver"
                            : publicKey.equals(
                                organizationRoles.viewer,
                            )
                                ? "Viewer"
                                : "Employee"
                : "Unassigned";

    const canCreatePayroll =
        currentRole === "Owner" ||
        currentRole === "Admin" ||
        currentRole === "Approver";

    const canManageTreasury =
        currentRole === "Owner" ||
        currentRole === "Admin" ||
        currentRole === "Finance";

    const canManageStreams =
        currentRole === "Owner" ||
        currentRole === "Admin" ||
        currentRole === "Finance" ||
        currentRole === "Approver";

    const canClaimPayroll =
        currentRole === "Employee";

    return (
        <main className="dashboard-shell">
            <div className="dashboard-container">
                <header className="dashboard-header flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="dashboard-brand-block">
                        <p className="dashboard-eyebrow">
                            Programmable payment infrastructure
                        </p>

                        <h1 className="dashboard-title">
                            TokenvaPay
                        </h1>

                        <p className="dashboard-subtitle">
                            Payroll operations for global teams — treasury, payment streams,
                            employee claims, and financial reporting in one workspace.
                        </p>
                    </div>

                    <div className="dashboard-wallet"><WalletButton /></div>
                </header>

                <nav className="demo-nav" aria-label="Dashboard sections">
                    <a href="#overview">Overview</a>
                    <a href="#payroll">Payroll</a>
                    <a href="#treasury">Treasury</a>
                    <a href="#employees">Employees</a>
                    <a href="#reports">Reports</a>
                    <a href="#activity">Activity</a>
                </nav>

                {message && (
                    <div className="dashboard-message mt-8 rounded-xl border p-4 text-sm">
                        {message}
                    </div>
                )}

                {actionError && (
                    <div className="dashboard-error mt-8 rounded-xl border p-4 text-sm">
                        {actionError}
                    </div>
                )}

                <div id="overview">
                    <CompanyOverview
                        treasuryBalance={
                            vaultBalance ?? "0"
                        }
                        payrollThisMonth={
                            payrollReport
                                ? formatTokenAmount(
                                    BigInt(
                                        payrollReport.grossPayout,
                                    ),
                                )
                                : ""
                        }
                        payrollLoading={
                            payrollReportLoading
                        }
                        activeStreamCount={
                            activeStreamCount
                        }
                        employeeCount={
                            employeeCount
                        }
                        hasRecentActivity={
                            indexedStreams.length > 0
                        }
                        currentRole={
                            currentRole
                        }
                    />
                </div>

                <div id="payroll">
                    <p className="demo-section-label">
                        Payroll Operations
                    </p>
                    <CompanySetup
                        organizationExists={
                            organizationExists
                        }
                        vaultExists={
                            vaultExists
                        }
                        rolesExists={
                            rolesExists
                        }
                        onboardingLoading={
                            onboardingLoading
                        }
                        publicKey={
                            publicKey
                                ? publicKey.toBase58()
                                : null
                        }
                        mint={mint}
                        currentRole={
                            currentRole
                        }
                        canCreatePayroll={
                            canCreatePayroll
                        }
                        canManageTreasury={
                            canManageTreasury
                        }
                        canManageStreams={
                            canManageStreams
                        }
                        canClaimPayroll={
                            canClaimPayroll
                        }
                        organizationAddress={
                            organization
                                ? organization.toBase58()
                                : null
                        }
                        vaultAddress={
                            vault
                                ? vault.toBase58()
                                : null
                        }
                        vaultBalance={
                            vaultBalance ?? "0"
                        }
                        tokenBalance={
                            tokenBalance ?? "0"
                        }
                        onSetup={
                            handleCompanySetup
                        }
                        shortenAddress={
                            shortenAddress
                        }
                    />
                    <CreatePayroll
                        payrollTemplate={
                            payrollTemplate
                        }
                        setPayrollTemplate={
                            setPayrollTemplate
                        }
                        payrollType={
                            payrollType
                        }
                        setPayrollType={
                            setPayrollType
                        }
                        employeeAddress={
                            employeeAddress
                        }
                        setEmployeeAddress={
                            setEmployeeAddress
                        }
                        streamId={
                            streamId
                        }
                        setStreamId={
                            setStreamId
                        }
                        streamAmount={
                            streamAmount
                        }
                        setStreamAmount={
                            setStreamAmount
                        }
                        mounted={
                            mounted
                        }
                        startTime={
                            startTime
                        }
                        setStartTime={
                            setStartTime
                        }
                        endTime={
                            endTime
                        }
                        setEndTime={
                            setEndTime
                        }
                        streamLoading={
                            streamLoading
                        }
                        canCreatePayroll={
                            canCreatePayroll
                        }
                        vaultExists={
                            vaultExists
                        }
                        employeeWalletValid={
                            employeeWalletValid
                        }
                        onTemplateChange={
                            applyPayrollTemplate
                        }
                        onCreate={
                            handleCreateStream
                        }
                    />
                    <ActiveStream
                        streamData={
                            streamData
                        }
                        stream={
                            stream
                        }
                        streamEscrow={
                            streamEscrow
                        }
                        claimable={
                            claimable
                        }
                        earnedDisplay={
                            earnedDisplay
                        }
                        streamLoading={
                            streamLoading
                        }
                        streamError={
                            streamError
                        }
                        actionLoading={
                            actionLoading
                        }
                        actionErrorStream={
                            actionErrorStream
                        }
                        canManageStreams={
                            canManageStreams
                        }
                        currentRole={
                            currentRole
                        }
                        indexedStreams={
                            indexedStreams
                        }
                        indexedStreamsLoading={
                            indexedStreamsLoading
                        }
                        indexedStreamsError={
                            indexedStreamsError
                        }
                        onTopUp={
                            handleTopUp
                        }
                        onCancel={
                            handleCancel
                        }
                        onClaim={
                            handleClaim
                        }
                        onRefreshIndexedStreams={() =>
                            void refreshIndexedStreams()
                        }
                        shortenAddress={
                            shortenAddress
                        }
                        formatTokenAmount={
                            formatTokenAmount
                        }
                    />
                </div>

                <div id="treasury">
                    <TreasuryFunding
                        depositAmount={
                            depositAmount
                        }
                        setDepositAmount={
                            setDepositAmount
                        }
                        depositLoading={
                            depositLoading
                        }
                        canManageTreasury={
                            canManageTreasury
                        }
                        vaultExists={
                            vaultExists
                        }
                        tokenAccount={
                            !!tokenAccount
                        }
                        onDeposit={
                            handleDeposit
                        }
                    />
                </div>

                <div id="employees">
                    <EmployeeDirectory
                        employeeAddress={
                            employeeAddress
                        }
                        setEmployeeAddress={
                            setEmployeeAddress
                        }
                        employeeWalletValid={
                            employeeWalletValid
                        }
                        setEmployeeWalletValid={
                            setEmployeeWalletValid
                        }
                        employeeDirectory={
                            employeeDirectory
                        }
                        onVerify={
                            handleVerifyEmployeeWallet
                        }
                        onSelect={
                            handleSelectEmployee
                        }
                        shortenAddress={
                            shortenAddress
                        }
                    />
                </div>


                <div id="reports">
                    <PayrollReports
                        payrollReport={
                            payrollReport
                        }
                        payrollReportLoading={
                            payrollReportLoading
                        }
                        payrollReportError={
                            payrollReportError
                        }
                        employeeReports={
                            employeeReports
                        }
                        employeeReportLoading={
                            employeeReportLoading
                        }
                        employeeReportError={
                            employeeReportError
                        }
                        treasuryReport={
                            treasuryReport
                        }
                        treasuryReportLoading={
                            treasuryReportLoading
                        }
                        treasuryReportError={
                            treasuryReportError
                        }
                        reconciliationReport={
                            reconciliationReport
                        }
                        reconciliationLoading={
                            reconciliationLoading
                        }
                        reconciliationError={
                            reconciliationError
                        }
                        exportLoading={
                            exportLoading
                        }
                        onPayrollRefresh={() =>
                            void loadPayrollReport()
                        }
                        onEmployeeRefresh={() =>
                            void loadEmployeeReports()
                        }
                        onTreasuryRefresh={() =>
                            void loadTreasuryReport()
                        }
                        onReconciliation={() =>
                            void loadReconciliationReport()
                        }
                        onExport={
                            downloadReportCsv
                        }
                        shortenAddress={
                            shortenAddress
                        }
                        formatTokenAmount={
                            formatTokenAmount
                        }
                    />
                </div>

                <OperationalDashboard />

                <div id="activity">
                    <p className="demo-section-label">
                        Activity
                    </p>
                    <ActivityStats />
                    <ActivityHistory />
                </div>
            </div>
        </main>
    );
}

export default function Home() {
    const router = useRouter();
    const {
        connected,
        connecting,
    } = useWallet();

    const [
        authChecked,
        setAuthChecked,
    ] = useState(false);

    const [
        authenticated,
        setAuthenticated,
    ] = useState(false);

    const [
        companyAccess,
        setCompanyAccess,
    ] = useState<CompanyAccess | null>(null);

    const [
        companyChecked,
        setCompanyChecked,
    ] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function checkAuthentication() {
            const session = await getSession();

            if (cancelled) {
                return;
            }

            if (!session?.authenticated) {
                setAuthenticated(false);
                setAuthChecked(true);
                setCompanyAccess(null);
                setCompanyChecked(false);
                router.replace("/login");
                return;
            }

            setAuthenticated(true);
            setAuthChecked(true);
        }

        void checkAuthentication();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        if (!authChecked || !authenticated) {
            return;
        }

        let cancelled = false;

        async function verifySession() {
            const session = await getSession();

            if (cancelled) {
                return;
            }

            if (!session?.authenticated) {
                setAuthenticated(false);
                setAuthChecked(true);
                setCompanyAccess(null);
                setCompanyChecked(false);
                router.replace("/login");
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void verifySession();
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );

        const interval = window.setInterval(
            () => {
                void verifySession();
            },
            30_000,
        );

        return () => {
            cancelled = true;
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.clearInterval(interval);
        };
    }, [
        authChecked,
        authenticated,
        router,
    ]);

    useEffect(() => {
        if (
            !authChecked ||
            !authenticated ||
            connecting
        ) {
            return;
        }

        if (!connected) {
            void (async () => {
                await logout();

                setAuthenticated(false);
                setCompanyAccess(null);
                setCompanyChecked(false);
                router.replace("/login");
            })();
        }
    }, [
        authChecked,
        authenticated,
        connected,
        connecting,
        router,
    ]);

    useEffect(() => {
        if (!authChecked || !authenticated) {
            return;
        }

        let cancelled = false;

        async function loadCompanyAccess() {
            try {
                const access =
                    await getCompanyAccess();

                if (cancelled) {
                    return;
                }

                setCompanyAccess(access);
                setCompanyChecked(true);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "COMPANY ACCESS ERROR:",
                    err,
                );

                if (cancelled) {
                    return;
                }

                setAuthenticated(false);
                setCompanyAccess(null);
                setCompanyChecked(false);

                router.replace("/login");
            }
        }

        void loadCompanyAccess();

        return () => {
            cancelled = true;
        };
    }, [
        authChecked,
        authenticated,
        router,
    ]);

if (
    !authChecked ||
    !authenticated ||
    !companyChecked
) {
    return (
        <main className="relative flex min-h-screen overflow-hidden bg-black text-white">
            {/* Ambient background */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >
                <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
                <div className="absolute bottom-[-18rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-white/[0.02] blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
                {/* Header */}
                <header className="flex h-20 items-center justify-between border-b border-white/[0.08]">
                    <div className="text-sm font-semibold tracking-[-0.02em]">
                        TokenvaPay
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/25">
                        Secure workspace
                    </div>
                </header>

                {/* Loading state */}
                <div className="flex flex-1 items-center justify-center py-16">
                    <div className="w-full max-w-md">
                        <div className="rounded-3xl border border-white/[0.1] bg-white/[0.035] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04]">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/80" />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Preparing your workspace
                                    </p>

                                    <p className="mt-1 text-xs text-white/35">
                                        Verifying authentication and company access
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 h-px overflow-hidden bg-white/[0.07]">
                                <div className="h-full w-1/3 animate-pulse bg-white/30" />
                            </div>

                            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/20">
                                TokenvaPay · Secure workspace
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex min-h-16 items-center justify-between border-t border-white/[0.07] py-5 text-[10px] uppercase tracking-[0.16em] text-white/20">
                    <span>TokenvaPay</span>
                    <span>© 2026 Tokenva</span>
                </footer>
            </div>
        </main>
    );
}

    if (!companyAccess?.company) {
        if (!companyAccess?.application) {
            return (
                <CompanyOnboarding
                    onSubmitted={(application) => {
                        setCompanyAccess({
                            company: null,
                            application,
                            hasDashboardAccess: false,
                            accessStatus: null,
                        });
                    }}
                />
            );
        }

        return (
            <ApplicationStatus
                application={companyAccess.application}
                onRefresh={async () => {
                    const access =
                        await getCompanyAccess();

                    setCompanyAccess(access);
                }}
            />
        );
    }

    if (!companyAccess.hasDashboardAccess) {
        return (
            <PilotStatus
                access={companyAccess}
                onRefresh={async () => {
                    const access =
                        await getCompanyAccess();

                    setCompanyAccess(access);
                }}
            />
        );
    }

    return <ProtectedHome />;
}