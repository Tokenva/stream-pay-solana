import { PublicKey } from "@solana/web3.js";
import { pool } from "./db.js";
import {
  getApplicationForWallet,
  type PilotApplication,
} from "./application.js";

export type PilotStatus =
  | "pending"
  | "approved"
  | "active"
  | "expired"
  | "rejected";

export type CompanyRole =
  | "owner"
  | "admin"
  | "finance"
  | "approver"
  | "viewer"
  | "employee";

export type Company = {
  id: string;
  name: string;
  treasury_wallet: string | null;
  created_by: string;
  pilot_status: PilotStatus;
  pilot_start: string | null;
  pilot_end: string | null;
  created_at: string;
  updated_at: string;
  role: CompanyRole;
};

export type CompanyAccess = {
  company: Company | null;
  hasDashboardAccess: boolean;
  accessStatus: PilotStatus | null;
  application: PilotApplication | null;
};

export async function getCompanyForWallet(
  wallet: string,
): Promise<Company | null> {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.treasury_wallet,
      c.created_by,
      c.pilot_status,
      c.pilot_start,
      c.pilot_end,
      c.created_at,
      c.updated_at,
      cm.role
    FROM company_members cm
    INNER JOIN companies c
      ON c.id = cm.company_id
    WHERE cm.wallet = $1
    ORDER BY c.created_at ASC
    LIMIT 1
    `,
    [wallet],
  );

  return result.rows[0] ?? null;
}

export async function getCompanyForWalletById(
  wallet: string,
  companyId: string,
): Promise<Company | null> {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.treasury_wallet,
      c.created_by,
      c.pilot_status,
      c.pilot_start,
      c.pilot_end,
      c.created_at,
      c.updated_at,
      cm.role
    FROM company_members cm
    INNER JOIN companies c
      ON c.id = cm.company_id
    WHERE cm.wallet = $1
      AND c.id = $2
    LIMIT 1
    `,
    [wallet, companyId],
  );

  return result.rows[0] ?? null;
}

export async function getCompaniesForWallet(
  wallet: string,
): Promise<Company[]> {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.treasury_wallet,
      c.created_by,
      c.pilot_status,
      c.pilot_start,
      c.pilot_end,
      c.created_at,
      c.updated_at,
      cm.role
    FROM company_members cm
    INNER JOIN companies c
      ON c.id = cm.company_id
    WHERE cm.wallet = $1
    ORDER BY c.created_at ASC
    `,
    [wallet],
  );

  return result.rows;
}

export async function getCompanyAccessForWallet(
  wallet: string,
): Promise<CompanyAccess> {
  const company = await getCompanyForWallet(wallet);

  if (!company) {
    return {
      company: null,
      hasDashboardAccess: false,
      accessStatus: null,
      application:
        await getApplicationForWallet(wallet),
    };
  }

  let accessStatus = company.pilot_status;

  if (
    company.pilot_status === "active" &&
    company.pilot_end &&
    new Date(company.pilot_end).getTime() <= Date.now()
  ) {
    accessStatus = "expired";
  }

  const hasDashboardAccess =
    accessStatus === "active" &&
    (!company.pilot_start ||
      new Date(company.pilot_start).getTime() <= Date.now()) &&
    (!company.pilot_end ||
      new Date(company.pilot_end).getTime() > Date.now());

  return {
    company,
    hasDashboardAccess,
    accessStatus,
    application: null,
  };
}

export async function createCompany(
  wallet: string,
  name: string,
  treasuryWallet?: string,
) {
  const authority = new PublicKey(wallet);

  if (!name.trim()) {
    throw new Error("Company name is required");
  }

  if (treasuryWallet) {
    new PublicKey(treasuryWallet);
  }

  const result = await pool.query(
    `
    INSERT INTO companies (
      name,
      treasury_wallet,
      created_by
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      name,
      treasury_wallet,
      created_by,
      pilot_status,
      pilot_start,
      pilot_end,
      created_at,
      updated_at
    `,
    [
      name.trim(),
      treasuryWallet?.trim() || null,
      authority.toBase58(),
    ],
  );

  const company = result.rows[0];

  await pool.query(
    `
    INSERT INTO company_members (
      company_id,
      wallet,
      role
    )
    VALUES ($1, $2, 'owner')
    `,
    [company.id, authority.toBase58()],
  );

  return {
    ...company,
    role: "owner" as CompanyRole,
  };
}

export async function updatePilotStatus(input: {
  companyId: string;
  status: PilotStatus;
  pilotStart?: string | null;
  pilotEnd?: string | null;
}) {
  const {
    companyId,
    status,
    pilotStart = null,
    pilotEnd = null,
  } = input;

  const allowedStatuses: PilotStatus[] = [
    "pending",
    "approved",
    "active",
    "expired",
    "rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid pilot status");
  }

  if (status === "active") {
    if (!pilotStart || !pilotEnd) {
      throw new Error(
        "Active pilot requires pilotStart and pilotEnd",
      );
    }

    const start = new Date(pilotStart);
    const end = new Date(pilotEnd);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new Error(
        "pilotStart and pilotEnd must be valid dates",
      );
    }

    if (end.getTime() <= start.getTime()) {
      throw new Error(
        "pilotEnd must be later than pilotStart",
      );
    }
  }

  const result = await pool.query(
    `
    UPDATE companies
    SET
      pilot_status = $2,
      pilot_start = $3,
      pilot_end = $4,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      treasury_wallet,
      created_by,
      pilot_status,
      pilot_start,
      pilot_end,
      created_at,
      updated_at
    `,
    [
      companyId,
      status,
      status === "active" ? pilotStart : null,
      status === "active" ? pilotEnd : null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function getCompanies() {
  const response = await fetch(
    "/api/backend/api/companies",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Unable to load companies",
    );
  }

  return data as {
    companies: Company[];
  };
}