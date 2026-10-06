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

const MINT =
    process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";

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
    } = useOrganization();

    const {
        vault,
        exists: vaultExists,
        balance: vaultBalance,
        refresh: refreshVault,
        createVault,
    } = useVault(MINT);

    const {
        tokenAccount,
        tokenBalance,
        deposit,
        loading: depositLoading,
    } = useDeposit(
        MINT,
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
        MINT,
        streamId,
        employeeAddress,
    );

    const {
        loading: actionLoading,
        error: actionErrorStream,
        topUp,
        cancel,
    } = useStreamActions(
        MINT,
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
                `http://localhost:4000/api/reports/payroll?month=${month}`,
                {
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
                `http://localhost:4000/api/reports/employees?month=${month}`,
                {
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
                `http://localhost:4000/api/reports/treasury?month=${month}`,
                {
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
                "http://localhost:4000/api/reports/reconciliation",
                {
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
                    ? "http://localhost:4000/api/reports/transactions.csv"
                    : `http://localhost:4000/api/reports/${type}.csv?month=${month}`;

            const response =
                await fetch(url);

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
                `streampay-${type}-${month}.csv`;

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
                            Tokenva
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
                        onboardingLoading={
                            onboardingLoading
                        }
                        publicKey={
                            publicKey
                                ? publicKey.toBase58()
                                : null
                        }
                        mint={MINT}
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
        void (async () => {
            const session =
                await getSession();

            if (!session?.authenticated) {
                router.replace("/login");
                return;
            }

            setAuthenticated(true);

            try {
                const access =
                    await getCompanyAccess();

                setCompanyAccess(access);
            } catch {
                router.replace("/login");
                return;
            }

            setAuthChecked(true);
            setCompanyChecked(true);
        })();
    }, [router]);

    useEffect(() => {
        if (
            !authChecked ||
            connecting
        ) {
            return;
        }

        if (!connected) {
            void logout();
            router.replace("/login");
        }
    }, [
        authChecked,
        connecting,
        connected,
        router,
    ]);

    if (
        !authChecked ||
        !authenticated ||
        !companyChecked
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p className="text-sm text-white/50">
                    Checking authentication...
                </p>
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