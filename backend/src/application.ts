import { PublicKey } from "@solana/web3.js";
import { pool } from "./db.js";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type PilotApplication = {
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
};

const PAYROLL_VOLUMES = [
  "Under $10K",
  "$10K - $50K",
  "$50K - $250K",
  "$250K - $1M",
  "$1M+",
];

function validateApplicationInput(input: {
  companyName: unknown;
  companyWebsite: unknown;
  workEmail: unknown;
  country: unknown;
  teamSize: unknown;
  monthlyStablecoinPayrollVolume: unknown;
  primaryUseCase: unknown;
  whyTokenva: unknown;
}) {
  const {
    companyName,
    companyWebsite,
    workEmail,
    country,
    teamSize,
    monthlyStablecoinPayrollVolume,
    primaryUseCase,
    whyTokenva,
  } = input;

  if (
    typeof companyName !== "string" ||
    !companyName.trim()
  ) {
    throw new Error("Company name is required");
  }

  if (
    typeof companyWebsite !== "string" ||
    !companyWebsite.trim()
  ) {
    throw new Error("Company website is required");
  }

  try {
    new URL(companyWebsite);
  } catch {
    throw new Error("Company website must be a valid URL");
  }

  if (
    typeof workEmail !== "string" ||
    !workEmail.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      workEmail.trim(),
    )
  ) {
    throw new Error("Valid work email is required");
  }

  if (
    typeof country !== "string" ||
    !country.trim()
  ) {
    throw new Error("Country is required");
  }

  const numericTeamSize =
    typeof teamSize === "number"
      ? teamSize
      : Number(teamSize);

  if (
    !Number.isInteger(numericTeamSize) ||
    numericTeamSize < 1
  ) {
    throw new Error(
      "Team size must be a positive integer",
    );
  }

  if (
    typeof monthlyStablecoinPayrollVolume !==
      "string" ||
    !PAYROLL_VOLUMES.includes(
      monthlyStablecoinPayrollVolume,
    )
  ) {
    throw new Error(
      "Invalid monthly payroll volume",
    );
  }

  if (
    typeof primaryUseCase !== "string" ||
    !primaryUseCase.trim()
  ) {
    throw new Error("Primary use case is required");
  }

  if (
    typeof whyTokenva !== "string" ||
    !whyTokenva.trim()
  ) {
    throw new Error("Why Tokenva is required");
  }

  return {
    companyName: companyName.trim(),
    companyWebsite: companyWebsite.trim(),
    workEmail: workEmail.trim().toLowerCase(),
    country: country.trim(),
    teamSize: numericTeamSize,
    monthlyStablecoinPayrollVolume,
    primaryUseCase: primaryUseCase.trim(),
    whyTokenva: whyTokenva.trim(),
  };
}

export async function getApplicationForWallet(
  wallet: string,
): Promise<PilotApplication | null> {
  const result = await pool.query(
    `
    SELECT
      id,
      wallet,
      company_name,
      company_website,
      work_email,
      country,
      team_size,
      monthly_stablecoin_payroll_volume,
      primary_use_case,
      why_tokenva,
      status,
      rejection_reason,
      company_id,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    FROM pilot_applications
    WHERE wallet = $1
    LIMIT 1
    `,
    [wallet],
  );

  return result.rows[0] ?? null;
}

export async function createApplication(
  wallet: string,
  input: {
    companyName: unknown;
    companyWebsite: unknown;
    workEmail: unknown;
    country: unknown;
    teamSize: unknown;
    monthlyStablecoinPayrollVolume: unknown;
    primaryUseCase: unknown;
    whyTokenva: unknown;
  },
): Promise<PilotApplication> {
  const normalizedWallet =
    new PublicKey(wallet).toBase58();

  const values =
    validateApplicationInput(input);

  const existing =
    await getApplicationForWallet(
      normalizedWallet,
    );

  if (existing) {
    throw new Error(
      "A pilot application already exists for this wallet",
    );
  }

  const companyResult = await pool.query(
    `
    SELECT id
    FROM company_members
    WHERE wallet = $1
    LIMIT 1
    `,
    [normalizedWallet],
  );

  if (companyResult.rows[0]) {
    throw new Error(
      "This wallet already belongs to a company",
    );
  }

  const result = await pool.query(
    `
    INSERT INTO pilot_applications (
      wallet,
      company_name,
      company_website,
      work_email,
      country,
      team_size,
      monthly_stablecoin_payroll_volume,
      primary_use_case,
      why_tokenva
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING
      id,
      wallet,
      company_name,
      company_website,
      work_email,
      country,
      team_size,
      monthly_stablecoin_payroll_volume,
      primary_use_case,
      why_tokenva,
      status,
      rejection_reason,
      company_id,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    `,
    [
      normalizedWallet,
      values.companyName,
      values.companyWebsite,
      values.workEmail,
      values.country,
      values.teamSize,
      values.monthlyStablecoinPayrollVolume,
      values.primaryUseCase,
      values.whyTokenva,
    ],
  );

  return result.rows[0];
}

export async function listApplications(
  status?: ApplicationStatus,
): Promise<PilotApplication[]> {
  const result = await pool.query(
    `
    SELECT
      id,
      wallet,
      company_name,
      company_website,
      work_email,
      country,
      team_size,
      monthly_stablecoin_payroll_volume,
      primary_use_case,
      why_tokenva,
      status,
      rejection_reason,
      company_id,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    FROM pilot_applications
    ${status ? "WHERE status = $1" : ""}
    ORDER BY created_at DESC
    `,
    status ? [status] : [],
  );

  return result.rows;
}

export async function approveApplication(
  applicationId: string,
  reviewer: string,
): Promise<PilotApplication> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult =
      await client.query(
        `
        SELECT *
        FROM pilot_applications
        WHERE id = $1
        FOR UPDATE
        `,
        [applicationId],
      );

    const application =
      applicationResult.rows[0];

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== "pending") {
      throw new Error(
        "Only pending applications can be approved",
      );
    }

    const existingCompany =
      await client.query(
        `
        SELECT c.id
        FROM company_members cm
        INNER JOIN companies c
          ON c.id = cm.company_id
        WHERE cm.wallet = $1
        LIMIT 1
        `,
        [application.wallet],
      );

    if (existingCompany.rows[0]) {
      throw new Error(
        "This wallet already belongs to a company",
      );
    }

    const companyResult =
      await client.query(
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
          $2,
          'approved'
        )
        RETURNING id
        `,
        [
          application.company_name,
          application.wallet,
        ],
      );

    const companyId =
      companyResult.rows[0].id;

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
      [
        companyId,
        application.wallet,
      ],
    );

    const updated =
      await client.query(
        `
        UPDATE pilot_applications
        SET
          status = 'approved',
          company_id = $2,
          reviewed_at = NOW(),
          reviewed_by = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          wallet,
          company_name,
          company_website,
          work_email,
          country,
          team_size,
          monthly_stablecoin_payroll_volume,
          primary_use_case,
          why_tokenva,
          status,
          rejection_reason,
          company_id,
          reviewed_at,
          reviewed_by,
          created_at,
          updated_at
        `,
        [
          applicationId,
          companyId,
          reviewer,
        ],
      );

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectApplication(
  applicationId: string,
  reviewer: string,
  rejectionReason: string,
): Promise<PilotApplication> {
  if (!rejectionReason.trim()) {
    throw new Error(
      "Rejection reason is required",
    );
  }

  const result = await pool.query(
    `
    UPDATE pilot_applications
    SET
      status = 'rejected',
      rejection_reason = $2,
      reviewed_at = NOW(),
      reviewed_by = $3,
      updated_at = NOW()
    WHERE id = $1
      AND status = 'pending'
    RETURNING
      id,
      wallet,
      company_name,
      company_website,
      work_email,
      country,
      team_size,
      monthly_stablecoin_payroll_volume,
      primary_use_case,
      why_tokenva,
      status,
      rejection_reason,
      company_id,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    `,
    [
      applicationId,
      rejectionReason.trim(),
      reviewer,
    ],
  );

  if (!result.rows[0]) {
    throw new Error(
      "Pending application not found",
    );
  }

  return result.rows[0];
}