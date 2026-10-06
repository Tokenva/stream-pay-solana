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
  new PublicKey(wallet);

  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Company name is required");
  }

  if (normalizedName.length > 120) {
    throw new Error(
      "Company name must be 120 characters or less",
    );
  }

  let normalizedTreasuryWallet: string | null =
    treasuryWallet?.trim() || wallet;

  normalizedTreasuryWallet =
    new PublicKey(normalizedTreasuryWallet).toBase58();

  const existing = await pool.query(
    `
    SELECT c.id
    FROM company_members cm
    INNER JOIN companies c
      ON c.id = cm.company_id
    WHERE cm.wallet = $1
    LIMIT 1
    `,
    [wallet],
  );

  if (existing.rows[0]) {
    throw new Error(
      "This wallet already belongs to a company",
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const companyResult = await client.query(
      `
      INSERT INTO companies (
        name,
        treasury_wallet,
        created_by,
        pilot_status
      )
      VALUES (
        $1,
        $2,
        $3,
        'pending'
      )
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
        normalizedName,
        normalizedTreasuryWallet,
        wallet,
      ],
    );

    const company = companyResult.rows[0];

    await client.query(
      `
      INSERT INTO company_members (
        company_id,
        wallet,
        role
      )
      VALUES (
        $1,
        $2,
        'owner'
      )
      `,
      [company.id, wallet],
    );

    await client.query("COMMIT");

    return {
      ...company,
      role: "owner" as const,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
