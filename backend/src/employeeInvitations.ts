import crypto from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { pool } from "./db.js";
import {
  getCompanyForWalletById,
} from "./company.js";

const INVITATION_TTL_DAYS = 7;

export type EmployeeInvitation = {
  id: string;
  company_id: string;
  employee_wallet: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
};

function hashInvitationCode(code: string) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

function generateInvitationCode() {
  return `TV-${crypto
    .randomBytes(18)
    .toString("base64url")}`;
}

async function assertEmployeeManager(
  wallet: string,
  companyId: string,
) {
  const company =
    await getCompanyForWalletById(
      wallet,
      companyId,
    );

  if (!company) {
    throw new Error(
      "Company access required",
    );
  }

  if (
    company.role !== "owner" &&
    company.role !== "admin"
  ) {
    throw new Error(
      "Only company owners and admins can manage employees",
    );
  }

  return company;
}

export async function createEmployeeInvitation(input: {
  companyId: string;
  employeeWallet: string;
  createdBy: string;
}) {
  const {
    companyId,
    employeeWallet,
    createdBy,
  } = input;

  await assertEmployeeManager(
    createdBy,
    companyId,
  );

  const normalizedWallet =
    new PublicKey(employeeWallet)
      .toBase58();

  const existingMember =
    await pool.query(
      `
      SELECT id
      FROM company_members
      WHERE company_id = $1
        AND wallet = $2
      LIMIT 1
      `,
      [
        companyId,
        normalizedWallet,
      ],
    );

  if (existingMember.rows[0]) {
    throw new Error(
      "This wallet is already a company member",
    );
  }

  await pool.query(
    `
    UPDATE employee_invitations
    SET
      status = 'revoked',
      revoked_at = NOW()
    WHERE company_id = $1
      AND employee_wallet = $2
      AND status = 'pending'
    `,
    [
      companyId,
      normalizedWallet,
    ],
  );

  const code =
    generateInvitationCode();

  const codeHash =
    hashInvitationCode(code);

  const result =
    await pool.query(
      `
      INSERT INTO employee_invitations (
        company_id,
        employee_wallet,
        code_hash,
        status,
        expires_at,
        created_by
      )
      VALUES (
        $1,
        $2,
        $3,
        'pending',
        NOW() + INTERVAL '${INVITATION_TTL_DAYS} days',
        $4
      )
      RETURNING
        id,
        company_id,
        employee_wallet,
        status,
        expires_at,
        accepted_at,
        revoked_at,
        created_by,
        created_at
      `,
      [
        companyId,
        normalizedWallet,
        codeHash,
        createdBy,
      ],
    );

  return {
    invitation:
      result.rows[0] as EmployeeInvitation,
    code,
  };
}

export async function listEmployeeInvitations(
  wallet: string,
  companyId: string,
) {
  await assertEmployeeManager(
    wallet,
    companyId,
  );

  const result =
    await pool.query(
      `
      SELECT
        id,
        company_id,
        employee_wallet,
        status,
        expires_at,
        accepted_at,
        revoked_at,
        created_by,
        created_at
      FROM employee_invitations
      WHERE company_id = $1
      ORDER BY created_at DESC
      `,
      [companyId],
    );

  return result.rows as EmployeeInvitation[];
}

export async function revokeEmployeeInvitation(
  wallet: string,
  companyId: string,
  invitationId: string,
) {
  await assertEmployeeManager(
    wallet,
    companyId,
  );

  const result =
    await pool.query(
      `
      UPDATE employee_invitations
      SET
        status = 'revoked',
        revoked_at = NOW()
      WHERE id = $1
        AND company_id = $2
        AND status = 'pending'
      RETURNING id
      `,
      [
        invitationId,
        companyId,
      ],
    );

  if (!result.rows[0]) {
    throw new Error(
      "Pending invitation not found",
    );
  }
}

export async function acceptEmployeeInvitation(
  code: string,
  wallet: string,
) {
  const normalizedCode =
    code.trim();

  if (!normalizedCode) {
    throw new Error(
      "Invitation code is required",
    );
  }

  const normalizedWallet =
    new PublicKey(wallet)
      .toBase58();

  const codeHash =
    hashInvitationCode(
      normalizedCode,
    );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const invitationResult =
      await client.query(
        `
        SELECT
          id,
          company_id,
          employee_wallet,
          status,
          expires_at
        FROM employee_invitations
        WHERE code_hash = $1
        FOR UPDATE
        `,
        [codeHash],
      );

    const invitation =
      invitationResult.rows[0];

    if (!invitation) {
      throw new Error(
        "Invalid invitation",
      );
    }

    if (
      invitation.status !==
      "pending"
    ) {
      throw new Error(
        "This invitation is no longer available",
      );
    }

    if (
      new Date(
        invitation.expires_at,
      ).getTime() <= Date.now()
    ) {
      throw new Error(
        "This invitation has expired",
      );
    }

    if (
      invitation.employee_wallet !==
      normalizedWallet
    ) {
      throw new Error(
        "Connected wallet does not match this invitation",
      );
    }

    const existingMember =
      await client.query(
        `
        SELECT id
        FROM company_members
        WHERE company_id = $1
          AND wallet = $2
        LIMIT 1
        `,
        [
          invitation.company_id,
          normalizedWallet,
        ],
      );

    if (existingMember.rows[0]) {
      throw new Error(
        "This wallet is already a company member",
      );
    }

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
        'employee'
      )
      `,
      [
        invitation.company_id,
        normalizedWallet,
      ],
    );

    await client.query(
      `
      UPDATE employee_invitations
      SET
        status = 'accepted',
        accepted_at = NOW()
      WHERE id = $1
      `,
      [invitation.id],
    );

    await client.query("COMMIT");

    return {
      companyId:
        invitation.company_id,
      wallet:
        normalizedWallet,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}