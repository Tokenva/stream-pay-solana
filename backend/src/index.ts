import "dotenv/config";
import bs58 from "bs58";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { initializeDatabase, pool } from "./db.js";

import {
  createApplication,
  getApplicationForWallet,
  listApplications,
  approveApplication,
  rejectApplication,
} from "./application.js";

import {
  getCompanyForWallet,
  getCompanyForWalletById,
  getCompaniesForWallet,
  getCompanyAccessForWallet,
  createCompany,
  updatePilotStatus,
} from "./company.js";

import {
  createEmployeeInvitation,
  listEmployeeInvitations,
  revokeEmployeeInvitation,
  acceptEmployeeInvitation,
} from "./employeeInvitations.js";

import {
  createAuthNonce,
  authenticateWallet,
  getSession,
  deleteSession,
} from "./auth.js";

import {
  syncStreams,
  lastSyncAt,
  lastSyncCount,
} from "./indexer.js";

import {
  startActivitySubscription,
} from "./activityIndexer.js";

import { PublicKey } from "@solana/web3.js";

import {
  withRpcFailover,
  withProgramFailover,
  rpcConnections,
  PROGRAM_ID,
} from "./solana.js";

import { log } from "./logger.js";
import { checkOperationalAlerts } from "./alerts.js";
import { auditLog, listAuditLogs } from "./audit.js";
import {
  registerCrossChainMessage,
  listCrossChainMessages,
  getCrossChainMessage,
  updateCrossChainMessageStatus,
} from "./crossChain.js";
import {
  registerWebhook,
  listWebhooks,
  deleteWebhook,
  queueWebhookEvent,
  deliverWebhook,
} from "./webhooks.js";

const app = express();

const allowedCorsOrigins = (
  process.env.TOKENVAPAY_CORS_ORIGINS ??
  "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin: allowedCorsOrigins,
  }),
);

app.use(
  express.json({
    limit: "32kb",
  }),
);

function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const configuredKey =
    process.env.TOKENVAPAY_API_KEY?.trim();

  if (!configuredKey) {
    log("error", "api_auth_not_configured", {
      path: req.path,
    });

    return res.status(503).json({
      error: "API authentication is not configured",
    });
  }

  const authorization =
    req.get("authorization") ?? "";

  const prefix = "Bearer ";

  if (!authorization.startsWith(prefix)) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const providedKey =
    authorization.slice(prefix.length).trim();

  const providedBuffer =
    Buffer.from(providedKey);

  const configuredBuffer =
    Buffer.from(configuredKey);

  if (
    providedBuffer.length !==
    configuredBuffer.length ||
    !crypto.timingSafeEqual(
      providedBuffer,
      configuredBuffer,
    )
  ) {
    return res.status(401).json({
      error: "Invalid authentication credentials",
    });
  }

  return next();
}

function isValidSolanaAddress(
  value: unknown,
) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function isValidTransactionSignature(
  value: unknown,
) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    return bs58.decode(value).length === 64;
  } catch {
    return false;
  }
}

type VerifiedTransactionInstruction = {
  action: string;
  organization: string | null;
  employee: string | null;
  instructionIndex: number;
};

const VERIFIED_TRANSACTION_ACTIONS = new Set([
  "deposit",
  "createorganization",
  "initializevault",
  "createstream",
  "claim",
  "topupstream",
  "cancelstream",
]);

function normalizeTransactionAction(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]/g, "");
}

function deriveTransactionParticipants(
  action: string,
  accounts: string[],
) {
  let organization: string | null = null;
  let employee: string | null = null;

  switch (normalizeTransactionAction(action)) {
    case "deposit":
    case "createorganization":
    case "initializevault":
      organization = accounts[1] ?? null;
      break;

    case "createstream":
    case "topupstream":
      organization = accounts[1] ?? null;
      employee = accounts[2] ?? null;
      break;

    case "claim":
      employee = accounts[0] ?? null;
      break;

    case "cancelstream":
      organization = accounts[1] ?? null;
      employee = accounts[2] ?? null;
      break;

    default:
      break;
  }

  return {
    organization,
    employee,
  };
}

async function verifyTransactionOnChain(
  signature: string,
): Promise<{
  slot: number;
  instructions: VerifiedTransactionInstruction[];
}> {
  const transaction = await withRpcFailover(
    (rpcConnection) =>
      rpcConnection.getParsedTransaction(
        signature,
        {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        },
      ),
  );

  if (!transaction) {
    throw new Error(
      "Transaction was not found on Solana",
    );
  }

  if (transaction.meta?.err) {
    throw new Error(
      "Transaction failed on Solana",
    );
  }

  const logs =
    transaction.meta?.logMessages ?? [];

  const instructionNames = logs
    .filter((logMessage) =>
      logMessage.includes(
        "Program log: Instruction:",
      ),
    )
    .map((logMessage) =>
      logMessage
        .split(
          "Program log: Instruction:",
        )[1]
        ?.trim(),
    )
    .filter(
      (instruction): instruction is string =>
        Boolean(instruction) &&
        VERIFIED_TRANSACTION_ACTIONS.has(
          normalizeTransactionAction(
            instruction,
          ),
        ),
    );

  const programInstructions =
    transaction.transaction.message.instructions.filter(
      (instruction) =>
        "programId" in instruction &&
        instruction.programId.equals(PROGRAM_ID) &&
        "accounts" in instruction,
    );

  const verifiedInstructions: VerifiedTransactionInstruction[] =
    [];

  for (
    let instructionIndex = 0;
    instructionIndex < programInstructions.length;
    instructionIndex++
  ) {
    const instruction =
      programInstructions[instructionIndex];

    if (!("accounts" in instruction)) {
      continue;
    }

    const action =
      instructionNames[instructionIndex];

    if (!action) {
      continue;
    }

    const accounts = instruction.accounts.map(
      (account) => account.toBase58(),
    );

    const {
      organization,
      employee,
    } = deriveTransactionParticipants(
      action,
      accounts,
    );

    verifiedInstructions.push({
      action,
      organization,
      employee,
      instructionIndex,
    });
  }

  if (verifiedInstructions.length === 0) {
    throw new Error(
      "Transaction does not contain a recognized Tokenva instruction",
    );
  }

  return {
    slot: transaction.slot,
    instructions: verifiedInstructions,
  };
}

app.use(
  "/api/transactions",
  requireApiKey,
);

app.use(
  "/api/webhooks",
  requireApiKey,
);

app.use(
  "/api/cross-chain/messages",
  requireApiKey,
);

app.use(
  "/api/ops",
  requireApiKey,
);

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    log("info", "http_request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

const port = Number(
  process.env.PORT ?? 4000,
);

const RETRY_BASE_DELAY_SECONDS = 5;
const RETRY_MAX_DELAY_SECONDS = 300;
const QUEUE_WORKER_INTERVAL_MS = 5_000;
const STALE_JOB_TIMEOUT_SECONDS = 120;

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text =
    value instanceof Date
      ? value.toISOString()
      : String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(
  headers: string[],
  rows: unknown[][],
) {
  return [
    headers,
    ...rows,
  ]
    .map((row) =>
      row
        .map(escapeCsvCell)
        .join(","),
    )
    .join("\n") + "\n";
}

app.get("/health", async (_req, res) => {
  let database = "ok";
  let rpc = "ok";

  try {
    await pool.query("SELECT 1");
  } catch (error) {
    database = "error";

    log("error", "health_database_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }

  try {
    await withRpcFailover((rpcConnection) =>
      rpcConnection.getEpochInfo(),
    );
  } catch (error) {
    rpc = "error";

    log("error", "health_rpc_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }

  const ok =
    database === "ok" &&
    rpc === "ok";

  return res.status(ok ? 200 : 503).json({
    ok,
    service: "tokenva-backend",
    database,
    rpc,
    rpcEndpoints: rpcConnections.length,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/streams", async (req, res) => {
  try {
    const accounts =
      await withProgramFailover((rpcProgram) =>
        rpcProgram.account.stream.all(),
      );

    const {
      organization,
      employee,
      canceled,
    } = req.query;

    const streams = accounts
      .map(({ publicKey, account }) => ({
        address: publicKey.toBase58(),
        organization:
          account.organization.toBase58(),
        employee:
          account.employee.toBase58(),
        vault:
          account.vault.toBase58(),
        escrow:
          account.escrow.toBase58(),
        mint:
          account.mint.toBase58(),
        streamId:
          account.streamId.toString(),
        totalAmount:
          account.totalAmount.toString(),
        startTime:
          account.startTime.toString(),
        endTime:
          account.endTime.toString(),
        claimedAmount:
          account.claimedAmount.toString(),
        canceled:
          account.canceled,
        cancelTime:
          account.cancelTime.toString(),
      }))
      .filter((stream) => {
        if (
          typeof organization === "string" &&
          stream.organization !== organization
        ) {
          return false;
        }

        if (
          typeof employee === "string" &&
          stream.employee !== employee
        ) {
          return false;
        }

        if (typeof canceled === "string") {
          const expected = canceled === "true";

          if (stream.canceled !== expected) {
            return false;
          }
        }

        return true;
      });

    res.json({
      count: streams.length,
      streams,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch streams",
    });
  }
});

app.get(
  "/api/streams/:address",
  async (req, res) => {
    try {
      const address = new PublicKey(
        req.params.address,
      );

      const account =
        await withProgramFailover((rpcProgram) =>
          rpcProgram.account.stream.fetch(address),
        );

      res.json({
        address: address.toBase58(),
        organization:
          account.organization.toBase58(),
        employee:
          account.employee.toBase58(),
        vault:
          account.vault.toBase58(),
        escrow:
          account.escrow.toBase58(),
        mint:
          account.mint.toBase58(),
        streamId:
          account.streamId.toString(),
        totalAmount:
          account.totalAmount.toString(),
        startTime:
          account.startTime.toString(),
        endTime:
          account.endTime.toString(),
        claimedAmount:
          account.claimedAmount.toString(),
        canceled:
          account.canceled,
        cancelTime:
          account.cancelTime.toString(),
      });
    } catch (error) {
      console.error(error);

      res.status(404).json({
        error: "Stream not found",
      });
    }
  },
);

app.get(
  "/api/db/streams",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const result = await pool.query(
        `
      SELECT
        address,
        organization,
        employee,
        vault,
        escrow,
        mint,
        stream_id,
        total_amount,
        start_time,
        end_time,
        claimed_amount,
        canceled,
        cancel_time,
        updated_at
      FROM streams
      WHERE organization = $1
      ORDER BY stream_id ASC
      `,
        [organization],
      );

      res.json({
        count: result.rows.length,
        streams: result.rows,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to read indexed streams",
      });
    }
  },
);

app.get(
  "/api/indexed/streams",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const companyId =
      typeof req.query.companyId === "string"
        ? req.query.companyId
        : null;

    if (!companyId) {
      return res.status(400).json({
        error: "Company ID is required",
      });
    }

    const company =
      await getCompanyForWalletById(
        wallet,
        companyId,
      );

    if (!company) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    if (!company.created_by) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    const authority = new PublicKey(company.created_by);
    const [organization] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("organization"),
        authority.toBuffer(),
      ],
      PROGRAM_ID,
    );
    const organizationAddress = organization.toBase58();

    try {
      const {
        employee,
        canceled,
      } = req.query;

      const conditions: string[] = [
        "organization = $1",
      ];

      const values: Array<string | number> = [
        organizationAddress,
      ];

      if (company.role === "employee") {
        values.push(wallet);
        conditions.push(
          `employee = $${values.length}`,
        );
      } else if (typeof employee === "string") {
        values.push(employee);
        conditions.push(
          `employee = $${values.length}`,
        );
      }

      if (typeof canceled === "string") {
        values.push(
          canceled === "true" ? "true" : "false",
        );
        conditions.push(
          `canceled = $${values.length}`,
        );
      }

      const whereClause =
        `WHERE ${conditions.join(" AND ")}`;

      const result = await pool.query(
        `
      SELECT
        address,
        organization,
        employee,
        vault,
        escrow,
        mint,
        stream_id,
        total_amount,
        start_time,
        end_time,
        claimed_amount,
        canceled,
        cancel_time,
        updated_at
      FROM streams
      ${whereClause}
      ORDER BY stream_id ASC
      `,
        values,
      );

      res.json({
        count: result.rows.length,
        streams: result.rows,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to fetch indexed streams",
      });
    }
  },
);

app.get(
  "/api/indexed/streams/:address",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const companyId =
      typeof req.query.companyId === "string"
        ? req.query.companyId
        : null;

    if (!companyId) {
      return res.status(400).json({
        error: "Company ID is required",
      });
    }

    const company =
      await getCompanyForWalletById(
        wallet,
        companyId,
      );

    if (!company) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    const organization =
      company.created_by;

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const result = await pool.query(
        `
      SELECT
        address,
        organization,
        employee,
        vault,
        escrow,
        mint,
        stream_id,
        total_amount,
        start_time,
        end_time,
        claimed_amount,
        canceled,
        cancel_time,
        updated_at
      FROM streams
      WHERE address = $1
  AND organization = $2
  ${company.role === "employee"
          ? "AND employee = $3"
          : ""
        }
      `,
        company.role === "employee"
          ? [req.params.address, organization, wallet]
          : [req.params.address, organization],
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: "Indexed stream not found",
        });

        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to fetch indexed stream",
      });
    }
  },
);


app.get("/api/indexer/status", (_req, res) => {
  res.json({
    status: "running",
    lastSyncAt,
    indexedStreams: lastSyncCount,
  });
});

app.get(
  "/api/activities",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const companyId =
      typeof req.query.companyId === "string"
        ? req.query.companyId
        : null;

    if (!companyId) {
      return res.status(400).json({
        error: "Company ID is required",
      });
    }

    const company = await getCompanyForWalletById(
      wallet,
      companyId,
    );

    if (!company) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    const authority = new PublicKey(company.created_by);

    const [organization] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("organization"),
        authority.toBuffer(),
      ],
      PROGRAM_ID,
    );

    const customerOrganization = organization.toBase58();

    try {
      const {
        stream,
        employee,
      } = req.query;

      const conditions: string[] = [
        "organization = $1",
      ];

      const values: Array<string | number> = [
        customerOrganization,
      ];

      const limitRaw =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : 20;

      const offsetRaw =
        typeof req.query.offset === "string"
          ? Number(req.query.offset)
          : 0;

      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.floor(limitRaw), 1), 100)
        : 20;

      const offset = Number.isFinite(offsetRaw)
        ? Math.max(Math.floor(offsetRaw), 0)
        : 0;

      if (typeof stream === "string") {
        values.push(stream);
        conditions.push(
          `stream_address = $${values.length}`,
        );
      }

      if (typeof employee === "string") {
        values.push(employee);
        conditions.push(
          `employee = $${values.length}`,
        );
      }

      const whereClause =
        `WHERE ${conditions.join(" AND ")}`;

      const limitIndex = values.length + 1;
      const offsetIndex = values.length + 2;

      values.push(limit);
      values.push(offset);

      const result = await pool.query(
        `
      SELECT
        id,
        signature,
        instruction_index,
        instruction,
        slot,
        block_time,
        stream_address,
        organization,
        employee,
        created_at,
        COUNT(*) OVER() AS total_count
      FROM activities
      ${whereClause}
      ORDER BY slot DESC, id DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
        values,
      );

      const total =
        result.rows.length > 0
          ? Number(result.rows[0].total_count)
          : 0;

      const activities = result.rows.map(
        ({ total_count, ...activity }) =>
          activity,
      );

      res.json({
        count: activities.length,
        total,
        limit,
        offset,
        hasMore: offset + activities.length < total,
        activities,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to fetch activities",
      });
    }
  },
);

app.get(
  "/api/activities/stats",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const result = await pool.query(
        `
        SELECT
          instruction,
          COUNT(*)::integer AS count
        FROM activities
        WHERE organization = $1
        GROUP BY instruction
        ORDER BY count DESC
        `,
        [organization],
      );

      const totalResult =
        await pool.query(
          `
          SELECT COUNT(*)::integer AS count
          FROM activities
          WHERE organization = $1
          `,
          [organization],
        );

      return res.json({
        total:
          totalResult.rows[0]?.count ?? 0,
        byInstruction: result.rows,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error:
          "Failed to fetch activity stats",
      });
    }
  },
);


app.post("/api/transactions", async (req, res) => {
  try {
    const {
      signature,
      action,
      organization = null,
      employee = null,
    } = req.body ?? {};

    if (
      !isValidTransactionSignature(signature)
    ) {
      return res.status(400).json({
        error:
          "signature must be a valid Solana transaction signature",
      });
    }

    if (
      typeof action !== "string" ||
      !action.trim() ||
      action.trim().length > 64 ||
      /[\u0000-\u001f\u007f]/.test(
        action.trim(),
      )
    ) {
      return res.status(400).json({
        error:
          "action must be a non-empty string of at most 64 characters",
      });
    }

    if (!isValidSolanaAddress(organization)) {
      return res.status(400).json({
        error:
          "organization must be a valid Solana address",
      });
    }

    if (!isValidSolanaAddress(employee)) {
      return res.status(400).json({
        error:
          "employee must be a valid Solana address",
      });
    }

    const normalizedSignature =
      signature.trim();

    const verified =
      await verifyTransactionOnChain(
        normalizedSignature,
      );

    const normalizedAction =
      normalizeTransactionAction(action);

    const matchingInstructions =
      verified.instructions.filter(
        (instruction) =>
          normalizeTransactionAction(
            instruction.action,
          ) === normalizedAction,
      );

    if (matchingInstructions.length === 0) {
      return res.status(400).json({
        error:
          "action does not match the on-chain Tokenva instruction",
      });
    }

    const matchingInstruction =
      matchingInstructions.find(
        (instruction) =>
          (organization === null ||
            instruction.organization ===
            organization) &&
          (employee === null ||
            instruction.employee === employee),
      );

    if (!matchingInstruction) {
      return res.status(400).json({
        error:
          "organization or employee does not match the on-chain transaction",
      });
    }

    const verifiedOrganization =
      matchingInstruction.organization;

    const verifiedEmployee =
      matchingInstruction.employee;

    const result = await pool.query(
      `
      INSERT INTO transactions (
        signature,
        action,
        status,
        organization,
        employee,
        slot,
        updated_at
      )
      VALUES (
        $1,
        $2,
        'submitted',
        $3,
        $4,
        $5,
        NOW()
      )
      ON CONFLICT (signature)
      DO UPDATE SET
        action = EXCLUDED.action,
        organization = EXCLUDED.organization,
        employee = EXCLUDED.employee,
        slot = EXCLUDED.slot,
        updated_at = NOW()
      RETURNING
        id,
        signature,
        action,
        status,
        organization,
        employee,
        slot,
        error,
        created_at,
        updated_at,
        confirmed_at
      `,
      [
        normalizedSignature,
        matchingInstruction.action,
        verifiedOrganization,
        verifiedEmployee,
        verified.slot,
      ],
    );

    await auditLog({
      eventType: "transaction_registered",
      actorType: "api",
      entityType: "transaction",
      entityId: normalizedSignature,
      organization: verifiedOrganization,
      employee: verifiedEmployee,
      metadata: {
        action: matchingInstruction.action,
        status:
          result.rows[0]?.status ??
          "submitted",
        verifiedOnChain: true,
        instructionIndex:
          matchingInstruction.instructionIndex,
      },
    });

    return res.status(201).json(
      result.rows[0],
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message ===
      "Transaction was not found on Solana"
    ) {
      return res.status(404).json({
        error: message,
      });
    }

    if (
      message ===
      "Transaction failed on Solana"
    ) {
      return res.status(400).json({
        error: message,
      });
    }

    if (
      message ===
      "Transaction does not contain a recognized Tokenva instruction"
    ) {
      return res.status(400).json({
        error: message,
      });
    }

    console.error(error);

    return res.status(500).json({
      error:
        "Failed to register transaction",
    });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const {
      organization,
      status,
      limit = "50",
    } = req.query;

    const values: unknown[] = [];
    const conditions: string[] = [];

    if (typeof organization === "string") {
      values.push(organization);
      conditions.push(
        `organization = $${values.length}`,
      );
    }

    if (typeof status === "string") {
      values.push(status);
      conditions.push(
        `status = $${values.length}`,
      );
    }

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100,
    );

    values.push(parsedLimit);

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
      SELECT
        id,
        signature,
        action,
        status,
        organization,
        employee,
        slot,
        error,
        created_at,
        updated_at,
        confirmed_at
      FROM transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length}
      `,
      values,
    );

    return res.json({
      count: result.rows.length,
      transactions: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch transactions",
    });
  }
});

app.get("/api/transactions/:signature", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        signature,
        action,
        status,
        organization,
        employee,
        slot,
        error,
        created_at,
        updated_at,
        confirmed_at
      FROM transactions
      WHERE signature = $1
      `,
      [req.params.signature],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch transaction",
    });
  }
});

let transactionStatusCheckRunning = false;

async function syncTransactionWebhookEvents() {
  const recent = await pool.query(`
    SELECT
      signature,
      action,
      status,
      organization,
      employee,
      slot,
      error,
      updated_at
    FROM transactions
    WHERE updated_at >= NOW() - INTERVAL '2 minutes'
    ORDER BY updated_at ASC
  `);

  for (const row of recent.rows) {
    const eventId =
      `${row.signature}:${row.status}:${new Date(row.updated_at).getTime()}`;

    await queueWebhookEvent(
      `transaction.${row.status}`,
      eventId,
      {
        signature: row.signature,
        action: row.action,
        status: row.status,
        organization: row.organization,
        employee: row.employee,
        slot: row.slot,
        error: row.error,
      },
    );
  }
}

async function reconcileTransactionStatuses(): Promise<{
  checked: number;
  updated: number;
}> {
  if (transactionStatusCheckRunning) {
    return {
      checked: 0,
      updated: 0,
    };
  }

  transactionStatusCheckRunning = true;

  try {
    const pending = await pool.query(
      `
      SELECT signature
      FROM transactions
      WHERE status = 'submitted'
      ORDER BY created_at ASC
      LIMIT 100
      `,
    );

    if (pending.rows.length === 0) {
      return {
        checked: 0,
        updated: 0,
      };
    }

    const signatures = pending.rows.map(
      (row) => row.signature,
    );

    const response =
      await withRpcFailover((rpcConnection) =>
        rpcConnection.getSignatureStatuses(
          signatures,
          {
            searchTransactionHistory: true,
          },
        ),
      );

    let updated = 0;

    for (
      let index = 0;
      index < signatures.length;
      index += 1
    ) {
      const signature = signatures[index];
      const status = response.value[index];

      if (!status) {
        continue;
      }

      if (status.err) {
        await pool.query(
          `
          UPDATE transactions
          SET
            status = 'failed',
            error = $2,
            updated_at = NOW()
          WHERE signature = $1
          `,
          [
            signature,
            JSON.stringify(status.err),
          ],
        );

        await auditLog({
          eventType: "transaction_failed",
          actorType: "worker",
          entityType: "transaction",
          entityId: signature,
          metadata: {
            status: "failed",
            error: status.err,
          },
        });

        updated += 1;
        continue;
      }

      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        await pool.query(
          `
          UPDATE transactions
          SET
            status = 'confirmed',
            slot = $2,
            error = NULL,
            updated_at = NOW(),
            confirmed_at =
              COALESCE(
                confirmed_at,
                NOW()
              )
          WHERE signature = $1
          `,
          [
            signature,
            status.slot,
          ],
        );

        await auditLog({
          eventType: "transaction_confirmed",
          actorType: "worker",
          entityType: "transaction",
          entityId: signature,
          metadata: {
            status: "confirmed",
            slot: status.slot,
            confirmationStatus:
              status.confirmationStatus,
          },
        });

        updated += 1;
      }
    }

    return {
      checked: signatures.length,
      updated,
    };
  } catch (error) {
    log("error", "transaction_reconciliation_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    // Important: allow the queue worker to retry this job.
    throw error;
  } finally {
    transactionStatusCheckRunning = false;
  }
}

async function reconcileCrossChainMessages(): Promise<{
  checked: number;
  updated: number;
}> {
  const result = await pool.query(
    `
    SELECT
      id,
      operation_id,
      organization,
      employee,
      destination_tx_hash
    FROM cross_chain_messages
    WHERE status NOT IN (
      'destination_confirmed',
      'failed'
    )
      AND destination_tx_hash IS NOT NULL
    ORDER BY updated_at ASC
    LIMIT 100
    `,
  );

  let checked = 0;
  let updated = 0;

  for (const message of result.rows) {
    checked += 1;

    const transactionResult = await pool.query(
      `
      SELECT
        status,
        error
      FROM transactions
      WHERE signature = $1
      LIMIT 1
      `,
      [message.destination_tx_hash],
    );

    const transaction =
      transactionResult.rows[0];

    if (!transaction) {
      continue;
    }

    if (transaction.status === "confirmed") {
      await pool.query(
        `
        UPDATE cross_chain_messages
        SET
          status = 'destination_confirmed',
          error = NULL,
          updated_at = NOW(),
          completed_at =
            COALESCE(completed_at, NOW())
        WHERE id = $1
        `,
        [message.id],
      );

      await auditLog({
        eventType:
          "cross_chain_message_reconciled",
        actorType: "worker",
        entityType: "cross_chain_message",
        entityId: String(message.id),
        organization:
          message.organization,
        employee: message.employee,
        metadata: {
          operationId:
            message.operation_id,
          destinationTxHash:
            message.destination_tx_hash,
          reconciledStatus:
            "destination_confirmed",
        },
      });

      log(
        "info",
        "cross_chain_message_reconciled",
        {
          id: message.id,
          operationId:
            message.operation_id,
          status:
            "destination_confirmed",
        },
      );

      updated += 1;
      continue;
    }

    if (transaction.status === "failed") {
      const errorMessage =
        transaction.error
          ? `Destination transaction failed: ${transaction.error}`
          : "Destination transaction failed";

      await pool.query(
        `
        UPDATE cross_chain_messages
        SET
          status = 'failed',
          error = $2,
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          message.id,
          errorMessage,
        ],
      );

      await auditLog({
        eventType:
          "cross_chain_message_reconciled",
        actorType: "worker",
        entityType: "cross_chain_message",
        entityId: String(message.id),
        organization:
          message.organization,
        employee: message.employee,
        metadata: {
          operationId:
            message.operation_id,
          destinationTxHash:
            message.destination_tx_hash,
          reconciledStatus:
            "failed",
          error:
            errorMessage,
        },
      });

      log(
        "error",
        "cross_chain_message_reconciled",
        {
          id: message.id,
          operationId:
            message.operation_id,
          status: "failed",
          error: errorMessage,
        },
      );

      updated += 1;
    }
  }

  return {
    checked,
    updated,
  };
}

async function runReconciliation() {
  const transactions =
    await reconcileTransactionStatuses();

  const crossChain =
    await reconcileCrossChainMessages();

  const summary = {
    transactions,
    crossChain,
  };

  log(
    "info",
    "reconciliation_completed",
    summary,
  );

  await auditLog({
    eventType:
      "reconciliation_completed",
    actorType: "worker",
    entityType: "system",
    entityId: "tokenva",
    metadata: summary,
  });
}

async function scheduleReconciliationJob() {
  try {
    const result = await pool.query(`
      WITH lock AS (
        SELECT pg_advisory_xact_lock(417001)
      )
      INSERT INTO job_queue (
        job_type,
        payload,
        run_after,
        updated_at
      )
      SELECT
        'reconciliation',
        '{}'::jsonb,
        NOW(),
        NOW()
      FROM lock
      WHERE NOT EXISTS (
        SELECT 1
        FROM job_queue
        WHERE job_type = 'reconciliation'
          AND status IN (
            'pending',
            'running'
          )
      )
      RETURNING id
    `);

    if (result.rows[0]) {
      log(
        "info",
        "reconciliation_job_enqueued",
        {
          jobId: result.rows[0].id,
        },
      );
    }
  } catch (error) {
    log(
      "error",
      "reconciliation_job_schedule_failed",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

async function enqueueJob(
  jobType: string,
  payload: Record<string, unknown>,
  delaySeconds = 0,
) {
  await pool.query(
    `
    INSERT INTO job_queue (
      job_type,
      payload,
      run_after,
      updated_at
    )
    VALUES (
      $1,
      $2::jsonb,
      NOW() + ($3 * INTERVAL '1 second'),
      NOW()
    )
    `,
    [
      jobType,
      JSON.stringify(payload),
      delaySeconds,
    ],
  );
}

async function claimNextJob() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(`
      SELECT
        id,
        job_type,
        payload,
        attempts,
        max_attempts
      FROM job_queue
      WHERE status = 'pending'
        AND run_after <= NOW()
      ORDER BY run_after ASC, id ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (result.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }

    const job = result.rows[0];

    await client.query(
      `
      UPDATE job_queue
      SET
        status = 'running',
        locked_at = NOW(),
        attempts = attempts + 1,
        updated_at = NOW()
      WHERE id = $1
      `,
      [job.id],
    );

    await client.query("COMMIT");

    return {
      ...job,
      attempts: Number(job.attempts) + 1,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function completeJob(id: number) {
  await pool.query(
    `
    UPDATE job_queue
    SET
      status = 'completed',
      locked_at = NULL,
      updated_at = NOW(),
      completed_at = NOW()
    WHERE id = $1
    `,
    [id],
  );
}

async function retryJob(
  id: number,
  attempts: number,
  maxAttempts: number,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (attempts >= maxAttempts) {
    await pool.query(
      `
      UPDATE job_queue
      SET
        status = 'failed',
        locked_at = NULL,
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [id, message],
    );

    log("error", "queue_job_retry_exhausted", {
      jobId: id,
      attempts,
      maxAttempts,
      error: message,
    });

    return;
  }

  const delaySeconds = Math.min(
    2 ** Math.max(attempts - 1, 0) *
    RETRY_BASE_DELAY_SECONDS,
    RETRY_MAX_DELAY_SECONDS,
  );

  await pool.query(
    `
    UPDATE job_queue
    SET
      status = 'pending',
      locked_at = NULL,
      last_error = $2,
      run_after =
        NOW() + ($3 * INTERVAL '1 second'),
      updated_at = NOW()
    WHERE id = $1
    `,
    [id, message, delaySeconds],
  );

  log("warn", "queue_job_retry_scheduled", {
    jobId: id,
    attempt: attempts,
    nextAttempt: attempts + 1,
    maxAttempts,
    retryDelaySeconds: delaySeconds,
    error: message,
  });
}

async function processJob(job: {
  id: number;
  job_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}) {
  if (job.job_type === "reconciliation") {
    await runReconciliation();
    await completeJob(job.id);
    return;
  }

  if (job.job_type === "webhook_delivery") {
    const deliveryId = job.payload.deliveryId;

    if (
      typeof deliveryId !== "number" ||
      !Number.isInteger(deliveryId)
    ) {
      await completeJob(job.id);
      return;
    }

    await deliverWebhook(deliveryId);
    await completeJob(job.id);
    return;
  }

  if (job.job_type === "transaction_status") {
    const signature = job.payload.signature;

    if (typeof signature !== "string" || !signature) {
      await completeJob(job.id);
      return;
    }

    const response =
      await withRpcFailover((rpcConnection) =>
        rpcConnection.getSignatureStatuses(
          [signature],
          {
            searchTransactionHistory: true,
          },
        ),
      );

    const status = response.value[0];

    if (!status) {
      await retryJob(
        job.id,
        job.attempts,
        job.max_attempts,
        new Error(
          "Transaction status not available yet",
        ),
      );
      return;
    }

    if (status.err) {
      await pool.query(
        `
        UPDATE transactions
        SET
          status = 'failed',
          error = $2,
          updated_at = NOW()
        WHERE signature = $1
        `,
        [
          signature,
          JSON.stringify(status.err),
        ],
      );

      await completeJob(job.id);
      return;
    }

    if (
      status.confirmationStatus === "confirmed" ||
      status.confirmationStatus === "finalized"
    ) {
      await pool.query(
        `
        UPDATE transactions
        SET
          status = 'confirmed',
          slot = $2,
          error = NULL,
          updated_at = NOW(),
          confirmed_at =
            COALESCE(confirmed_at, NOW())
        WHERE signature = $1
        `,
        [
          signature,
          status.slot,
        ],
      );

      await completeJob(job.id);
      return;
    }

    await retryJob(
      job.id,
      job.attempts,
      job.max_attempts,
      new Error(
        `Transaction still pending: ${status.confirmationStatus ?? "unknown"}`,
      ),
    );

    return;
  }

  await completeJob(job.id);
}

async function recoverStaleJobs() {
  const result = await pool.query(
    `
    UPDATE job_queue
    SET
      status = CASE
        WHEN attempts >= max_attempts
          THEN 'failed'
        ELSE 'pending'
      END,
      locked_at = NULL,
      run_after = CASE
        WHEN attempts >= max_attempts
          THEN run_after
        ELSE NOW()
      END,
      last_error = CASE
        WHEN attempts >= max_attempts
          THEN COALESCE(
            last_error,
            'Worker lease expired after stale job timeout'
          )
        ELSE
          'Worker lease expired; job requeued'
      END,
      updated_at = NOW()
    WHERE status = 'running'
      AND locked_at IS NOT NULL
      AND locked_at <
        NOW() - (
          $1 * INTERVAL '1 second'
        )
    RETURNING
      id,
      job_type,
      attempts,
      max_attempts,
      status,
      last_error
    `,
    [STALE_JOB_TIMEOUT_SECONDS],
  );

  for (const job of result.rows) {
    log(
      job.status === "failed"
        ? "error"
        : "warn",
      job.status === "failed"
        ? "queue_job_stale_exhausted"
        : "queue_job_stale_requeued",
      {
        jobId: job.id,
        jobType: job.job_type,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        status: job.status,
        error: job.last_error,
      },
    );
  }
}

let workerRunning = false;

async function runQueueWorker() {
  if (workerRunning) {
    return;
  }

  workerRunning = true;

  try {
    for (let index = 0; index < 10; index += 1) {
      const job = await claimNextJob();

      if (!job) {
        break;
      }

      try {
        await processJob(job);
      } catch (error) {
        await retryJob(
          job.id,
          job.attempts,
          job.max_attempts,
          error,
        );

        await auditLog({
          eventType: "queue_job_failed",
          actorType: "worker",
          entityType: "queue_job",
          entityId: String(job.id),
          metadata: {
            jobType: job.job_type,
            attempts: job.attempts,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        });
      }
    }
  } catch (error) {
    log("error", "queue_worker_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  } finally {
    workerRunning = false;
  }
}

app.get("/api/ops/metrics", async (_req, res) => {
  try {
    const [
      transactionResult,
      jobResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          status,
          COUNT(*)::integer AS count
        FROM transactions
        GROUP BY status
        ORDER BY status
      `),
      pool.query(`
        SELECT
          status,
          COUNT(*)::integer AS count
        FROM job_queue
        GROUP BY status
        ORDER BY status
      `),
    ]);

    const transactions: Record<string, number> = {};
    const jobs: Record<string, number> = {};

    for (const row of transactionResult.rows) {
      transactions[row.status] = row.count;
    }

    for (const row of jobResult.rows) {
      jobs[row.status] = row.count;
    }

    const payload = {
      service: "tokenva-backend",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      rpcEndpoints: rpcConnections.length,
      indexer: {
        lastSyncAt,
        indexedStreams: lastSyncCount,
      },
      transactions,
      jobs,
    };

    log("info", "ops_metrics_read", {
      transactionStatuses: transactions,
      jobStatuses: jobs,
    });

    return res.json(payload);
  } catch (error) {
    log("error", "ops_metrics_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    return res.status(500).json({
      error: "Failed to read operational metrics",
    });
  }
});

app.post("/api/webhooks", async (req, res) => {
  try {
    const { url } = req.body ?? {};

    if (
      typeof url !== "string" ||
      !url.trim()
    ) {
      return res.status(400).json({
        error: "url is required",
      });
    }

    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return res.status(400).json({
        error: "Webhook URL must use HTTP or HTTPS",
      });
    }

    const webhook = await registerWebhook(
      url.trim(),
    );

    await auditLog({
      eventType: "webhook_registered",
      actorType: "api",
      entityType: "webhook",
      entityId: String(webhook.id),
      metadata: {
        url: webhook.url,
      },
    });

    return res.status(201).json(webhook);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    log("error", "webhook_registration_failed", {
      error: message,
    });

    if (
      message ===
      "Webhook URL must use HTTP or HTTPS" ||
      message ===
      "Webhook URL must not contain credentials" ||
      message ===
      "Webhook URL must target a public host" ||
      message ===
      "Webhook hostname could not be resolved" ||
      message ===
      "Webhook URL must not resolve to a private or reserved address"
    ) {
      return res.status(400).json({
        error: message,
      });
    }

    return res.status(500).json({
      error: "Failed to register webhook",
    });
  }
});

app.get("/api/webhooks", async (_req, res) => {
  try {
    const webhooks = await listWebhooks();

    return res.json({
      count: webhooks.length,
      webhooks,
    });
  } catch (error) {
    log("error", "webhook_list_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    return res.status(500).json({
      error: "Failed to fetch webhooks",
    });
  }
});

app.delete("/api/webhooks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid webhook id",
      });
    }

    const webhook = await deleteWebhook(id);

    if (!webhook) {
      return res.status(404).json({
        error: "Webhook not found",
      });
    }

    await auditLog({
      eventType: "webhook_deleted",
      actorType: "api",
      entityType: "webhook",
      entityId: String(webhook.id),
    });

    return res.json({
      deleted: true,
      id: webhook.id,
    });
  } catch (error) {
    log("error", "webhook_delete_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    return res.status(500).json({
      error: "Failed to delete webhook",
    });
  }
});

app.post("/api/webhooks/events", async (req, res) => {
  try {
    const {
      eventType,
      eventId,
      data = {},
    } = req.body ?? {};

    if (
      typeof eventType !== "string" ||
      !eventType.trim()
    ) {
      return res.status(400).json({
        error: "eventType is required",
      });
    }

    if (
      typeof eventId !== "string" ||
      !eventId.trim()
    ) {
      return res.status(400).json({
        error: "eventId is required",
      });
    }

    const queued = await queueWebhookEvent(
      eventType.trim(),
      eventId.trim(),
      data,
    );

    await auditLog({
      eventType: "webhook_event_queued",
      actorType: "api",
      entityType: "webhook_event",
      entityId: eventId.trim(),
      metadata: {
        eventType: eventType.trim(),
        deliveriesQueued: queued,
      },
    });

    return res.status(202).json({
      accepted: true,
      queued,
    });
  } catch (error) {
    log("error", "webhook_event_queue_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    return res.status(500).json({
      error: "Failed to queue webhook event",
    });
  }
});

app.post(
  "/api/cross-chain/messages",
  async (req, res) => {
    try {
      const {
        gatewayTxHash,
        action,
        operationId,
        wormholeSequence,
        sourceChain,
        destinationChain,
        organization,
        employee,
      } = req.body ?? {};

      if (
        typeof gatewayTxHash !== "string" ||
        !gatewayTxHash.trim()
      ) {
        return res.status(400).json({
          error: "gatewayTxHash is required",
        });
      }

      if (
        typeof action !== "string" ||
        !action.trim()
      ) {
        return res.status(400).json({
          error: "action is required",
        });
      }

      if (
        typeof operationId !== "string" ||
        !operationId.trim()
      ) {
        return res.status(400).json({
          error: "operationId is required",
        });
      }

      if (
        wormholeSequence !== undefined &&
        wormholeSequence !== null &&
        typeof wormholeSequence !== "string"
      ) {
        return res.status(400).json({
          error:
            "wormholeSequence must be a string",
        });
      }

      const result =
        await registerCrossChainMessage({
          gatewayTxHash,
          action,
          operationId,
          wormholeSequence,
          sourceChain:
            typeof sourceChain === "number"
              ? sourceChain
              : undefined,
          destinationChain:
            typeof destinationChain === "number"
              ? destinationChain
              : undefined,
          organization:
            typeof organization === "string"
              ? organization
              : null,
          employee:
            typeof employee === "string"
              ? employee
              : null,
        });

      return res.status(201).json(result);
    } catch (error) {
      log(
        "error",
        "cross_chain_message_create_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to register cross-chain message",
      });
    }
  },
);

app.get(
  "/api/cross-chain/messages",
  async (req, res) => {
    try {
      const limitRaw =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : 50;

      const messages =
        await listCrossChainMessages({
          status:
            typeof req.query.status === "string"
              ? req.query.status
              : undefined,
          operationId:
            typeof req.query.operationId === "string"
              ? req.query.operationId
              : undefined,
          organization:
            typeof req.query.organization === "string"
              ? req.query.organization
              : undefined,
          employee:
            typeof req.query.employee === "string"
              ? req.query.employee
              : undefined,
          limit: Number.isFinite(limitRaw)
            ? Math.floor(limitRaw)
            : 50,
        });

      return res.json({
        count: messages.length,
        messages,
      });
    } catch (error) {
      log(
        "error",
        "cross_chain_message_list_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch cross-chain messages",
      });
    }
  },
);

app.get(
  "/api/cross-chain/messages/:id",
  async (req, res) => {
    try {
      const message =
        await getCrossChainMessage(
          req.params.id,
        );

      if (!message) {
        return res.status(404).json({
          error:
            "Cross-chain message not found",
        });
      }

      return res.json(message);
    } catch (error) {
      log(
        "error",
        "cross_chain_message_get_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to fetch cross-chain message",
      });
    }
  },
);

app.patch(
  "/api/cross-chain/messages/:id/status",
  async (req, res) => {
    try {
      const {
        status,
        vaaId,
        consumeTxHash,
        destinationTxHash,
        error,
      } = req.body ?? {};

      if (
        typeof status !== "string" ||
        !status.trim()
      ) {
        return res.status(400).json({
          error: "status is required",
        });
      }

      const message =
        await updateCrossChainMessageStatus({
          id: req.params.id,
          status,
          vaaId:
            typeof vaaId === "string"
              ? vaaId
              : null,
          consumeTxHash:
            typeof consumeTxHash === "string"
              ? consumeTxHash
              : null,
          destinationTxHash:
            typeof destinationTxHash === "string"
              ? destinationTxHash
              : null,
          error:
            typeof error === "string"
              ? error
              : null,
        });

      if (!message) {
        return res.status(404).json({
          error:
            "Cross-chain message not found",
        });
      }

      return res.json(message);
    } catch (error) {
      log(
        "error",
        "cross_chain_message_status_update_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cross-chain message",
      });
    }
  },
);

app.get(
  "/api/reports/employees",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const month =
        typeof req.query.month === "string"
          ? req.query.month.trim()
          : "";

      const targetMonth =
        /^\d{4}-\d{2}$/.test(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const [yearRaw, monthRaw] =
        targetMonth.split("-");

      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          error: "month must use YYYY-MM format",
        });
      }

      const monthStart = Math.floor(
        Date.UTC(
          year,
          monthNumber - 1,
          1,
        ) / 1000,
      );

      const nextMonthStart = Math.floor(
        Date.UTC(
          monthNumber === 12
            ? year + 1
            : year,
          monthNumber === 12
            ? 0
            : monthNumber,
          1,
        ) / 1000,
      );

      const result = await pool.query(
        `
      SELECT
        employee,
        total_amount,
        claimed_amount,
        start_time,
        end_time,
        canceled
      FROM streams
      WHERE organization = $1
        AND start_time >= $2
        AND start_time < $3
      ORDER BY start_time ASC
      `,
        [
          organization,
          monthStart,
          nextMonthStart,
        ],
      );

      const nowSeconds = Math.floor(
        Date.now() / 1000,
      );

      const employeeMap = new Map<
        string,
        {
          streamCount: number;
          grossPayout: bigint;
          totalClaimed: bigint;
          completed: number;
          pending: number;
          canceled: number;
        }
      >();

      for (const stream of result.rows) {
        const employee = stream.employee;

        const totalAmount = BigInt(
          stream.total_amount.toString(),
        );

        const claimedAmount = BigInt(
          stream.claimed_amount.toString(),
        );

        let report = employeeMap.get(employee);

        if (!report) {
          report = {
            streamCount: 0,
            grossPayout: BigInt(0),
            totalClaimed: BigInt(0),
            completed: 0,
            pending: 0,
            canceled: 0,
          };

          employeeMap.set(
            employee,
            report,
          );
        }

        report.streamCount += 1;
        report.grossPayout += totalAmount;
        report.totalClaimed += claimedAmount;

        if (stream.canceled) {
          report.canceled += 1;
        } else if (
          Number(stream.end_time) <=
          nowSeconds
        ) {
          report.completed += 1;
        } else {
          report.pending += 1;
        }
      }

      const employees = Array.from(
        employeeMap.entries(),
      ).map(
        ([
          employee,
          report,
        ]) => {
          const remaining =
            report.grossPayout -
            report.totalClaimed;

          return {
            employee,
            streamCount:
              report.streamCount,
            grossPayout:
              report.grossPayout.toString(),
            totalClaimed:
              report.totalClaimed.toString(),
            remaining:
              remaining.toString(),
            completed:
              report.completed,
            pending:
              report.pending,
            canceled:
              report.canceled,
          };
        },
      );

      return res.json({
        month: targetMonth,
        employeeCount:
          employees.length,
        employees,
      });
    } catch (error) {
      log(
        "error",
        "employee_report_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to generate employee report",
      });
    }
  });

app.get(
  "/api/reports/treasury",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const month =
        typeof req.query.month === "string"
          ? req.query.month.trim()
          : "";

      const targetMonth =
        /^\d{4}-\d{2}$/.test(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const [yearRaw, monthRaw] =
        targetMonth.split("-");

      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          error: "month must use YYYY-MM format",
        });
      }

      const monthStart = Math.floor(
        Date.UTC(
          year,
          monthNumber - 1,
          1,
        ) / 1000,
      );

      const nextMonthStart = Math.floor(
        Date.UTC(
          monthNumber === 12
            ? year + 1
            : year,
          monthNumber === 12
            ? 0
            : monthNumber,
          1,
        ) / 1000,
      );

      const nowSeconds = Math.floor(
        Date.now() / 1000,
      );

      const result = await pool.query(
        `
      SELECT
        COUNT(*)::integer AS stream_count,
        COALESCE(
          SUM(total_amount),
          0
        ) AS gross_payout,
        COALESCE(
          SUM(claimed_amount),
          0
        ) AS total_claimed,
        COUNT(*) FILTER (
          WHERE canceled = TRUE
        )::integer AS canceled,
        COUNT(*) FILTER (
          WHERE canceled = FALSE
            AND end_time <= $4
        )::integer AS completed,
        COUNT(*) FILTER (
          WHERE canceled = FALSE
            AND end_time > $4
        )::integer AS active
      FROM streams
      WHERE organization = $1
        AND start_time >= $2
        AND start_time < $3
      `,
        [
          organization,
          monthStart,
          nextMonthStart,
          nowSeconds,
        ],
      );

      const row = result.rows[0];

      const grossPayout = BigInt(
        row?.gross_payout?.toString() ?? "0",
      );

      const totalClaimed = BigInt(
        row?.total_claimed?.toString() ?? "0",
      );

      const outstanding =
        grossPayout - totalClaimed;

      const transactionResult =
        await pool.query(
          `
        SELECT
          status,
          COUNT(*)::integer AS count
        FROM transactions
        WHERE organization = $1
          AND created_at >= to_timestamp($2)
          AND created_at < to_timestamp($3)
        GROUP BY status
        ORDER BY status
        `,
          [
            organization,
            monthStart,
            nextMonthStart,
          ],
        );

      const transactions: Record<
        string,
        number
      > = {};

      for (
        const transaction
        of transactionResult.rows
      ) {
        transactions[
          transaction.status
        ] = transaction.count;
      }

      return res.json({
        month: targetMonth,
        streamCount:
          row?.stream_count ?? 0,
        grossPayout:
          grossPayout.toString(),
        totalClaimed:
          totalClaimed.toString(),
        outstanding:
          outstanding.toString(),
        active:
          row?.active ?? 0,
        completed:
          row?.completed ?? 0,
        canceled:
          row?.canceled ?? 0,
        transactions,
      });
    } catch (error) {
      log(
        "error",
        "treasury_report_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to generate treasury report",
      });
    }
  });

app.get(
  "/api/reports/payroll.csv",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const month =
        typeof req.query.month === "string"
          ? req.query.month.trim()
          : "";

      const targetMonth =
        /^\d{4}-\d{2}$/.test(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const [yearRaw, monthRaw] =
        targetMonth.split("-");

      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          error: "month must use YYYY-MM format",
        });
      }

      const monthStart = Math.floor(
        Date.UTC(
          year,
          monthNumber - 1,
          1,
        ) / 1000,
      );

      const nextMonthStart = Math.floor(
        Date.UTC(
          monthNumber === 12
            ? year + 1
            : year,
          monthNumber === 12
            ? 0
            : monthNumber,
          1,
        ) / 1000,
      );

      const result = await pool.query(
        `
      SELECT
        address,
        organization,
        employee,
        stream_id,
        total_amount,
        claimed_amount,
        start_time,
        end_time,
        canceled,
        cancel_time
      FROM streams
      WHERE organization = $1
        AND start_time >= $2
        AND start_time < $3
      ORDER BY start_time ASC
      `,
        [
          organization,
          monthStart,
          nextMonthStart,
        ],
      );

      const nowSeconds = Math.floor(
        Date.now() / 1000,
      );

      const rows = result.rows.map(
        (stream) => {
          const totalAmount =
            BigInt(
              stream.total_amount.toString(),
            );

          const claimedAmount =
            BigInt(
              stream.claimed_amount.toString(),
            );

          let status = "pending";

          if (stream.canceled) {
            status = "canceled";
          } else if (
            Number(stream.end_time) <=
            nowSeconds
          ) {
            status = "completed";
          }

          return [
            stream.address,
            stream.organization,
            stream.employee,
            stream.stream_id,
            totalAmount.toString(),
            claimedAmount.toString(),
            (
              totalAmount -
              claimedAmount
            ).toString(),
            stream.start_time,
            stream.end_time,
            status,
            stream.cancel_time,
          ];
        },
      );

      const csv = buildCsv(
        [
          "address",
          "organization",
          "employee",
          "stream_id",
          "total_amount_base_units",
          "claimed_amount_base_units",
          "remaining_amount_base_units",
          "start_time",
          "end_time",
          "status",
          "cancel_time",
        ],
        rows,
      );

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tokenva-payroll-${targetMonth}.csv"`,
      );

      return res.send(csv);
    } catch (error) {
      log(
        "error",
        "payroll_csv_export_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to export payroll CSV",
      });
    }
  });

app.get(
  "/api/reports/employees.csv",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const month =
        typeof req.query.month === "string"
          ? req.query.month.trim()
          : "";

      const targetMonth =
        /^\d{4}-\d{2}$/.test(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const [yearRaw, monthRaw] =
        targetMonth.split("-");

      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          error: "month must use YYYY-MM format",
        });
      }

      const monthStart = Math.floor(
        Date.UTC(
          year,
          monthNumber - 1,
          1,
        ) / 1000,
      );

      const nextMonthStart = Math.floor(
        Date.UTC(
          monthNumber === 12
            ? year + 1
            : year,
          monthNumber === 12
            ? 0
            : monthNumber,
          1,
        ) / 1000,
      );

      const nowSeconds = Math.floor(
        Date.now() / 1000,
      );

      const result = await pool.query(
        `
      SELECT
        employee,
        COUNT(*)::integer AS stream_count,
        COALESCE(
          SUM(total_amount),
          0
        ) AS gross_payout,
        COALESCE(
          SUM(claimed_amount),
          0
        ) AS total_claimed,
        COUNT(*) FILTER (
          WHERE canceled = TRUE
        )::integer AS canceled,
        COUNT(*) FILTER (
          WHERE canceled = FALSE
            AND end_time <= $4
        )::integer AS completed,
        COUNT(*) FILTER (
          WHERE canceled = FALSE
            AND end_time > $4
        )::integer AS pending
      FROM streams
      WHERE organization = $1
        AND start_time >= $2
        AND start_time < $3
      GROUP BY employee
      ORDER BY employee ASC
      `,
        [
          organization,
          monthStart,
          nextMonthStart,
          nowSeconds,
        ],
      );

      const rows = result.rows.map(
        (employee) => {
          const grossPayout =
            BigInt(
              employee.gross_payout.toString(),
            );

          const totalClaimed =
            BigInt(
              employee.total_claimed.toString(),
            );

          return [
            employee.employee,
            employee.stream_count,
            grossPayout.toString(),
            totalClaimed.toString(),
            (
              grossPayout -
              totalClaimed
            ).toString(),
            employee.completed,
            employee.pending,
            employee.canceled,
          ];
        },
      );

      const csv = buildCsv(
        [
          "employee",
          "stream_count",
          "gross_payout_base_units",
          "total_claimed_base_units",
          "remaining_base_units",
          "completed",
          "pending",
          "canceled",
        ],
        rows,
      );

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tokenva-employees-${targetMonth}.csv"`,
      );

      return res.send(csv);
    } catch (error) {
      log(
        "error",
        "employee_csv_export_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to export employee CSV",
      });
    }
  });


app.get(
  "/api/reports/transactions.csv",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const {
        employee,
        status,
      } = req.query;

      const conditions: string[] = [
        "organization = $1",
      ];

      const values: string[] = [
        organization,
      ];

      if (typeof employee === "string") {
        values.push(
          employee.trim(),
        );

        conditions.push(
          `employee = $${values.length}`,
        );
      }

      if (typeof status === "string") {
        values.push(
          status.trim(),
        );

        conditions.push(
          `status = $${values.length}`,
        );
      }

      const whereClause =
        `WHERE ${conditions.join(" AND ")}`;

      const result = await pool.query(
        `
      SELECT
        id,
        signature,
        action,
        status,
        organization,
        employee,
        slot,
        error,
        created_at,
        updated_at,
        confirmed_at
      FROM transactions
      ${whereClause}
      ORDER BY created_at DESC
      `,
        values,
      );

      const rows = result.rows.map(
        (transaction) => [
          transaction.id,
          transaction.signature,
          transaction.action,
          transaction.status,
          transaction.organization,
          transaction.employee,
          transaction.slot,
          transaction.error,
          transaction.created_at,
          transaction.updated_at,
          transaction.confirmed_at,
        ],
      );

      const csv = buildCsv(
        [
          "id",
          "signature",
          "action",
          "status",
          "organization",
          "employee",
          "slot",
          "error",
          "created_at",
          "updated_at",
          "confirmed_at",
        ],
        rows,
      );

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8",
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="tokenva-transactions.csv"',
      );

      return res.send(csv);
    } catch (error) {
      log(
        "error",
        "transaction_csv_export_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to export transaction CSV",
      });
    }
  });


app.get(
  "/api/reports/reconciliation",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const [
        chainAccounts,
        dbResult,
      ] = await Promise.all([
        withProgramFailover((rpcProgram) =>
          rpcProgram.account.stream.all(),
        ),
        pool.query(
          `
          SELECT
            address,
            organization,
            employee,
            vault,
            escrow,
            mint,
            stream_id,
            total_amount,
            start_time,
            end_time,
            claimed_amount,
            canceled,
            cancel_time
          FROM streams
          WHERE organization = $1
          `,
          [organization],
        ),
      ]);

      const dbMap = new Map(
        dbResult.rows.map(
          (stream) => [
            stream.address,
            stream,
          ],
        ),
      );

      const chainMap = new Map(
        chainAccounts
          .filter(
            ({ account }) =>
              account.organization.toBase58() ===
              organization,
          )
          .map(
            ({ publicKey, account }) => [
              publicKey.toBase58(),
              {
                address:
                  publicKey.toBase58(),
                organization:
                  account.organization.toBase58(),
                employee:
                  account.employee.toBase58(),
                vault:
                  account.vault.toBase58(),
                escrow:
                  account.escrow.toBase58(),
                mint:
                  account.mint.toBase58(),
                stream_id:
                  account.streamId.toString(),
                total_amount:
                  account.totalAmount.toString(),
                start_time:
                  account.startTime.toString(),
                end_time:
                  account.endTime.toString(),
                claimed_amount:
                  account.claimedAmount.toString(),
                canceled:
                  account.canceled,
                cancel_time:
                  account.cancelTime.toString(),
              },
            ],
          ),
      );

      let matched = 0;
      let mismatched = 0;
      let missingFromDb = 0;
      let staleInDb = 0;

      const details: Array<
        Record<string, unknown>
      > = [];

      for (
        const [
          address,
          chainStream,
        ] of chainMap
      ) {
        const dbStream =
          dbMap.get(address);

        if (!dbStream) {
          missingFromDb += 1;

          details.push({
            type: "missing_from_db",
            address,
          });

          continue;
        }

        const fields = [
          "organization",
          "employee",
          "vault",
          "escrow",
          "mint",
          "stream_id",
          "total_amount",
          "start_time",
          "end_time",
          "claimed_amount",
          "canceled",
          "cancel_time",
        ] as const;

        const differences =
          fields.filter(
            (field) => {
              const chainValue =
                String(
                  chainStream[field],
                );

              const dbValue =
                String(
                  dbStream[field],
                );

              return (
                chainValue !==
                dbValue
              );
            },
          );

        if (differences.length === 0) {
          matched += 1;
        } else {
          mismatched += 1;

          details.push({
            type: "mismatch",
            address,
            fields: differences,
          });
        }
      }

      for (
        const address of dbMap.keys()
      ) {
        if (!chainMap.has(address)) {
          staleInDb += 1;

          details.push({
            type: "stale_in_db",
            address,
          });
        }
      }

      return res.json({
        checked:
          chainMap.size,
        databaseStreams:
          dbMap.size,
        matched,
        mismatched,
        missingFromDb,
        staleInDb,
        healthy:
          mismatched === 0 &&
          missingFromDb === 0 &&
          staleInDb === 0,
        details:
          details.slice(0, 100),
      });
    } catch (error) {
      log(
        "error",
        "reconciliation_report_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to generate reconciliation report",
      });
    }
  },
);

app.get(
  "/api/reports/payroll",
  requireCustomerSession,
  async (req, res) => {
    const wallet =
      res.locals.wallet as string;

    const organization =
      await getCustomerOrganization(wallet);

    if (!organization) {
      return res.status(403).json({
        error: "Company access required",
      });
    }

    try {
      const month =
        typeof req.query.month === "string"
          ? req.query.month.trim()
          : "";

      const targetMonth =
        /^\d{4}-\d{2}$/.test(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const [yearRaw, monthRaw] =
        targetMonth.split("-");

      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          error: "month must use YYYY-MM format",
        });
      }

      const monthStart = Math.floor(
        Date.UTC(year, monthNumber - 1, 1) / 1000,
      );

      const nextMonthStart = Math.floor(
        Date.UTC(
          monthNumber === 12
            ? year + 1
            : year,
          monthNumber === 12
            ? 0
            : monthNumber,
          1,
        ) / 1000,
      );

      const result = await pool.query(
        `
      SELECT
        address,
        employee,
        total_amount,
        claimed_amount,
        start_time,
        end_time,
        canceled
      FROM streams
      WHERE organization = $1
        AND start_time >= $2
        AND start_time < $3
      ORDER BY start_time ASC
      `,
        [
          organization,
          monthStart,
          nextMonthStart,
        ],
      );

      const nowSeconds = Math.floor(
        Date.now() / 1000,
      );

      let grossPayout = BigInt(0);
      let totalClaimed = BigInt(0);
      let completed = 0;
      let pending = 0;
      let canceled = 0;

      const employees = new Set<string>();

      const reportStreams = result.rows.map(
        (stream) => {
          const totalAmount = BigInt(
            stream.total_amount.toString(),
          );

          const claimedAmount = BigInt(
            stream.claimed_amount.toString(),
          );

          grossPayout += totalAmount;
          totalClaimed += claimedAmount;

          employees.add(stream.employee);

          let status:
            | "completed"
            | "pending"
            | "canceled";

          if (stream.canceled) {
            status = "canceled";
            canceled += 1;
          } else if (
            Number(stream.end_time) <=
            nowSeconds
          ) {
            status = "completed";
            completed += 1;
          } else {
            status = "pending";
            pending += 1;
          }

          return {
            address: stream.address,
            employee: stream.employee,
            totalAmount:
              totalAmount.toString(),
            claimedAmount:
              claimedAmount.toString(),
            startTime:
              Number(stream.start_time),
            endTime:
              Number(stream.end_time),
            canceled:
              stream.canceled,
            status,
          };
        },
      );

      return res.json({
        month: targetMonth,
        employees: employees.size,
        grossPayout:
          grossPayout.toString(),
        totalClaimed:
          totalClaimed.toString(),
        completed,
        pending,
        canceled,
        streamCount:
          reportStreams.length,
        streams:
          reportStreams,
      });
    } catch (error) {
      log(
        "error",
        "payroll_report_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error: "Failed to generate payroll report",
      });
    }
  });


app.get("/api/ops/audit-logs", async (req, res) => {
  try {
    const limitRaw =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 50;

    const logs = await listAuditLogs({
      eventType:
        typeof req.query.eventType === "string"
          ? req.query.eventType
          : undefined,
      entityType:
        typeof req.query.entityType === "string"
          ? req.query.entityType
          : undefined,
      entityId:
        typeof req.query.entityId === "string"
          ? req.query.entityId
          : undefined,
      organization:
        typeof req.query.organization === "string"
          ? req.query.organization
          : undefined,
      limit: Number.isFinite(limitRaw)
        ? Math.floor(limitRaw)
        : 50,
    });

    return res.json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    log("error", "audit_log_query_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    return res.status(500).json({
      error: "Failed to fetch audit logs",
    });
  }
});

function getSessionToken(
  req: express.Request,
) {
  const cookie = req.get("cookie") ?? "";

  const match = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith("tokenva_session="),
    );

  return match
    ? decodeURIComponent(
      match.slice("tokenva_session=".length),
    )
    : null;
}

async function requireCustomerSession(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const session = await getSession(token);

  if (!session) {
    return res.status(401).json({
      error: "Session expired",
    });
  }

  res.locals.wallet = session.wallet;

  return next();
}

const CUSTOMER_REPORT_ROLES = new Set([
  "owner",
  "admin",
  "finance",
  "approver",
  "viewer",
]);

async function requireCustomerReportAccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const wallet =
    res.locals.wallet as string;

  const company =
    await getCompanyForWallet(wallet);

  if (!company) {
    return res.status(403).json({
      error: "Company access required",
    });
  }

  if (
    !CUSTOMER_REPORT_ROLES.has(
      company.role,
    )
  ) {
    return res.status(403).json({
      error:
        "Insufficient company permissions",
    });
  }

  res.locals.company = company;

  return next();
}

async function getCustomerOrganization(
  wallet: string,
) {
  const company =
    await getCompanyForWallet(wallet);

  if (!company) {
    return null;
  }

  const authority =
    new PublicKey(
      company.created_by,
    );

  const [organization] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("organization"),
        authority.toBuffer(),
      ],
      PROGRAM_ID,
    );

  return organization.toBase58();
}

app.post(
  "/api/auth/nonce",
  async (req, res) => {
    try {
      const wallet = req.body?.wallet;

      if (
        typeof wallet !== "string" ||
        wallet.length === 0
      ) {
        return res.status(400).json({
          error: "Wallet is required",
        });
      }

      const result =
        await createAuthNonce(wallet);

      return res.json(result);
    } catch {
      return res.status(400).json({
        error: "Invalid wallet",
      });
    }
  },
);

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        wallet,
        nonce,
        signature,
      } = req.body ?? {};

      if (
        typeof wallet !== "string" ||
        typeof nonce !== "string" ||
        typeof signature !== "string"
      ) {
        return res.status(400).json({
          error:
            "Wallet, nonce and signature are required",
        });
      }

      const result =
        await authenticateWallet({
          wallet,
          nonce,
          signature,
        });

      res.setHeader(
        "Set-Cookie",
        [
          `tokenva_session=${encodeURIComponent(
            result.sessionToken,
          )}`,
          "HttpOnly",
          "Path=/",
          "SameSite=Lax",
          "Max-Age=2592000",
          process.env.NODE_ENV === "production"
            ? "Secure"
            : "",
        ]
          .filter(Boolean)
          .join("; "),
      );

      return res.json({
        authenticated: true,
        wallet: result.wallet,
      });
    } catch (error) {
      return res.status(401).json({
        error:
          error instanceof Error
            ? error.message
            : "Authentication failed",
      });
    }
  },
);

app.get(
  "/api/auth/session",
  requireCustomerSession,
  async (_req, res) => {
    return res.json({
      authenticated: true,
      wallet: res.locals.wallet,
    });
  },
);

app.post(
  "/api/auth/logout",
  async (req, res) => {
    const token = getSessionToken(req);

    if (token) {
      await deleteSession(token);
    }

    res.setHeader(
      "Set-Cookie",
      [
        "tokenva_session=",
        "HttpOnly",
        "Path=/",
        "SameSite=Lax",
        "Max-Age=0",
        process.env.NODE_ENV === "production"
          ? "Secure"
          : "",
      ]
        .filter(Boolean)
        .join("; "),
    );

    return res.json({
      authenticated: false,
    });
  },
);

app.get(
  "/api/companies",
  requireCustomerSession,
  async (_req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const companies =
        await getCompaniesForWallet(wallet);

      return res.json({
        companies,
      });
    } catch (error) {
      log(
        "error",
        "companies_fetch_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error: "Failed to fetch companies",
      });
    }
  },
);

app.get(
  "/api/company/access",
  requireCustomerSession,
  async (_req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const access =
        await getCompanyAccessForWallet(wallet);

      return res.json(access);
    } catch (error) {
      log(
        "error",
        "company_access_fetch_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error: "Failed to fetch company access",
      });
    }
  },
);

app.get(
  "/api/company/access",
  requireCustomerSession,
  async (_req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const access =
        await getCompanyAccessForWallet(wallet);

      return res.json(access);
    } catch (error) {
      log(
        "error",
        "company_access_fetch_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error: "Failed to fetch company access",
      });
    }
  },
);

app.post(
  "/api/company",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const {
        name,
        treasuryWallet,
      } = req.body ?? {};

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          error: "Company name is required",
        });
      }

      if (
        treasuryWallet !== undefined &&
        typeof treasuryWallet !== "string"
      ) {
        return res.status(400).json({
          error: "Invalid treasury wallet",
        });
      }

      const company =
        await createCompany(
          wallet,
          name,
          treasuryWallet,
        );

      return res.status(201).json({
        company,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create company";

      return res.status(400).json({
        error: message,
      });
    }
  },
);

app.patch(
  "/api/ops/companies/:companyId/pilot",
  async (req, res) => {
    try {
      const {
        status,
        pilotStart,
        pilotEnd,
      } = req.body ?? {};

      const pilotStatus =
        typeof status === "string"
          ? status as import("./company.js").PilotStatus
          : null;

      if (
        typeof status !== "string"
      ) {
        return res.status(400).json({
          error: "status is required",
        });
      }

      const company =
        await updatePilotStatus({
          companyId: req.params.companyId,
          status: pilotStatus!,
          pilotStart:
            typeof pilotStart === "string"
              ? pilotStart
              : null,
          pilotEnd:
            typeof pilotEnd === "string"
              ? pilotEnd
              : null,
        });

      if (!company) {
        return res.status(404).json({
          error: "Company not found",
        });
      }

      await auditLog({
        eventType: "company_pilot_status_updated",
        actorType: "api",
        entityType: "company",
        entityId: company.id,
        metadata: {
          status: company.pilot_status,
          pilotStart: company.pilot_start,
          pilotEnd: company.pilot_end,
        },
      });

      return res.json({
        company,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update pilot status";

      return res.status(400).json({
        error: message,
      });
    }
  },
);

app.get(
  "/api/application",
  requireCustomerSession,
  async (_req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const application =
        await getApplicationForWallet(wallet);

      return res.json({
        application,
      });
    } catch (error) {
      log(
        "error",
        "pilot_application_fetch_failed",
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return res.status(500).json({
        error:
          "Failed to fetch pilot application",
      });
    }
  },
);

app.post(
  "/api/application",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const application =
        await createApplication(
          wallet,
          {
            companyName:
              req.body?.companyName,
            companyWebsite:
              req.body?.companyWebsite,
            workEmail:
              req.body?.workEmail,
            country:
              req.body?.country,
            teamSize:
              req.body?.teamSize,
            monthlyStablecoinPayrollVolume:
              req.body
                ?.monthlyStablecoinPayrollVolume,
            primaryUseCase:
              req.body?.primaryUseCase,
            whyTokenva:
              req.body?.whyTokenva,
          },
        );

      return res.status(201).json({
        application,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit pilot application";

      return res.status(400).json({
        error: message,
      });
    }
  },
);

app.get(
  "/api/ops/applications",
  async (req, res) => {
    try {
      const status =
        typeof req.query.status === "string"
          ? req.query.status
          : undefined;

      if (
        status &&
        ![
          "pending",
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          error: "Invalid application status",
        });
      }

      const applications =
        await listApplications(
          status as
          | "pending"
          | "approved"
          | "rejected"
          | undefined,
        );

      return res.json({
        applications,
      });
    } catch (error) {
      return res.status(500).json({
        error:
          "Failed to list applications",
      });
    }
  },
);

app.patch(
  "/api/ops/applications/:applicationId",
  async (req, res) => {
    try {
      const {
        status,
        rejectionReason,
      } = req.body ?? {};

      if (
        status !== "approved" &&
        status !== "rejected"
      ) {
        return res.status(400).json({
          error:
            "status must be approved or rejected",
        });
      }

      const reviewer =
        res.locals.wallet ??
        req.get("x-operator") ??
        "tokenva-ops";

      if (status === "approved") {
        const application =
          await approveApplication(
            req.params.applicationId,
            String(reviewer),
          );

        await auditLog({
          eventType:
            "pilot_application_approved",
          actorType: "api",
          entityType:
            "pilot_application",
          entityId: application.id,
          metadata: {
            companyId:
              application.company_id,
            wallet:
              application.wallet,
          },
        });

        return res.json({
          application,
        });
      }

      if (
        typeof rejectionReason !== "string" ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          error:
            "rejectionReason is required",
        });
      }

      const application =
        await rejectApplication(
          req.params.applicationId,
          String(reviewer),
          rejectionReason,
        );

      await auditLog({
        eventType:
          "pilot_application_rejected",
        actorType: "api",
        entityType:
          "pilot_application",
        entityId: application.id,
        metadata: {
          wallet:
            application.wallet,
          rejectionReason:
            application.rejection_reason,
        },
      });

      return res.json({
        application,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update application";

      return res.status(400).json({
        error: message,
      });
    }
  },
);


app.get(
  "/api/ops/applications",
  async (req, res) => {
    try {
      const status =
        typeof req.query.status === "string"
          ? req.query.status
          : undefined;

      if (
        status &&
        ![
          "pending",
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          error: "Invalid application status",
        });
      }

      const applications =
        await listApplications(
          status as
          | "pending"
          | "approved"
          | "rejected"
          | undefined,
        );

      return res.json({
        applications,
      });
    } catch (error) {
      return res.status(500).json({
        error:
          "Failed to list applications",
      });
    }
  },
);

app.patch(
  "/api/ops/applications/:applicationId",
  async (req, res) => {
    try {
      const {
        status,
        rejectionReason,
      } = req.body ?? {};

      if (
        status !== "approved" &&
        status !== "rejected"
      ) {
        return res.status(400).json({
          error:
            "status must be approved or rejected",
        });
      }

      const reviewer =
        res.locals.wallet ??
        req.get("x-operator") ??
        "tokenva-ops";

      if (status === "approved") {
        const application =
          await approveApplication(
            req.params.applicationId,
            String(reviewer),
          );

        await auditLog({
          eventType:
            "pilot_application_approved",
          actorType: "api",
          entityType:
            "pilot_application",
          entityId: application.id,
          metadata: {
            companyId:
              application.company_id,
            wallet:
              application.wallet,
          },
        });

        return res.json({
          application,
        });
      }

      if (
        typeof rejectionReason !== "string" ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          error:
            "rejectionReason is required",
        });
      }

      const application =
        await rejectApplication(
          req.params.applicationId,
          String(reviewer),
          rejectionReason,
        );

      await auditLog({
        eventType:
          "pilot_application_rejected",
        actorType: "api",
        entityType:
          "pilot_application",
        entityId: application.id,
        metadata: {
          wallet:
            application.wallet,
          rejectionReason:
            application.rejection_reason,
        },
      });

      return res.json({
        application,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update application";

      return res.status(400).json({
        error: message,
      });
    }
  },
);


app.post(
  "/api/company/invitations",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const {
        companyId,
        employeeWallet,
      } = req.body ?? {};

      if (
        typeof companyId !== "string" ||
        !companyId
      ) {
        return res.status(400).json({
          error:
            "companyId is required",
        });
      }

      if (
        typeof employeeWallet !==
        "string" ||
        !employeeWallet.trim()
      ) {
        return res.status(400).json({
          error:
            "Employee wallet is required",
        });
      }

      const result =
        await createEmployeeInvitation({
          companyId,
          employeeWallet,
          createdBy: wallet,
        });

      return res.status(201).json({
        invitation:
          result.invitation,
        code: result.code,
        path:
          `/join/${encodeURIComponent(
            result.code,
          )}`,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create invitation",
      });
    }
  },
);

app.delete(
  "/api/company/invitations/:invitationId",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const companyId =
        typeof req.query.companyId ===
          "string"
          ? req.query.companyId
          : "";

      if (!companyId) {
        return res.status(400).json({
          error:
            "companyId is required",
        });
      }

      await revokeEmployeeInvitation(
        wallet,
        companyId,
        Array.isArray(req.params.invitationId)
          ? req.params.invitationId[0]
          : req.params.invitationId,
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to revoke invitation",
      });
    }
  },
);

app.post(
  "/api/company/invitations/accept",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const { code } =
        req.body ?? {};

      if (
        typeof code !== "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          error:
            "Invitation code is required",
        });
      }

      const result =
        await acceptEmployeeInvitation(
          code,
          wallet,
        );

      return res.json({
        success: true,
        companyId:
          result.companyId,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation",
      });
    }
  },
);


app.get(
  "/api/company/invitations",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const companyId =
        typeof req.query.companyId ===
          "string"
          ? req.query.companyId
          : "";

      if (!companyId) {
        return res.status(400).json({
          error:
            "companyId is required",
        });
      }

      const invitations =
        await listEmployeeInvitations(
          wallet,
          companyId,
        );

      return res.json({
        invitations,
      });
    } catch (error) {
      return res.status(403).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch invitations",
      });
    }
  },
);

app.post(
  "/api/company/invitations",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const {
        companyId,
        employeeWallet,
      } = req.body ?? {};

      if (
        typeof companyId !== "string" ||
        !companyId
      ) {
        return res.status(400).json({
          error:
            "companyId is required",
        });
      }

      if (
        typeof employeeWallet !==
        "string" ||
        !employeeWallet.trim()
      ) {
        return res.status(400).json({
          error:
            "Employee wallet is required",
        });
      }

      const result =
        await createEmployeeInvitation({
          companyId,
          employeeWallet,
          createdBy: wallet,
        });

      return res.status(201).json({
        invitation:
          result.invitation,
        code: result.code,
        path:
          `/join/${encodeURIComponent(
            result.code,
          )}`,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create employee invitation",
      });
    }
  },
);

app.delete(
  "/api/company/invitations/:invitationId",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const companyId =
        typeof req.query.companyId ===
          "string"
          ? req.query.companyId
          : "";

      if (!companyId) {
        return res.status(400).json({
          error:
            "companyId is required",
        });
      }

      await revokeEmployeeInvitation(
        wallet,
        companyId,
        Array.isArray(req.params.invitationId)
          ? req.params.invitationId[0]
          : req.params.invitationId,
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to revoke invitation",
      });
    }
  },
);

app.post(
  "/api/company/invitations/accept",
  requireCustomerSession,
  async (req, res) => {
    try {
      const wallet =
        res.locals.wallet as string;

      const { code } =
        req.body ?? {};

      if (
        typeof code !== "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          error:
            "Invitation code is required",
        });
      }

      const result =
        await acceptEmployeeInvitation(
          code,
          wallet,
        );

      return res.json({
        success: true,
        companyId:
          result.companyId,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation",
      });
    }
  },
);


async function startServer() {
  await initializeDatabase();

  const count = await syncStreams();

  log("info", "initial_stream_index", {
    indexedStreams: count,
  });

  startActivitySubscription();

  void recoverStaleJobs();
  void scheduleReconciliationJob();
  void runQueueWorker();

  void checkOperationalAlerts(lastSyncAt);

  setInterval(async () => {
    try {
      const count = await syncStreams();

      log("info", "periodic_stream_index", {
        indexedStreams: count,
      });
    } catch (error) {
      log("error", "indexer_sync_failed", {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }, 60_000);

  setInterval(() => {
    void recoverStaleJobs();
    void scheduleReconciliationJob();
    void runQueueWorker();
    void syncTransactionWebhookEvents();
  }, QUEUE_WORKER_INTERVAL_MS);

  setInterval(() => {
    void checkOperationalAlerts(lastSyncAt);
  }, 60_000);

  app.listen(port, () => {
    log("info", "backend_started", {
      port,
      rpcEndpoints: rpcConnections.length,
    });

    console.log(
      `Tokenva backend running at http://localhost:${port}`,
    );
  });
}

startServer().catch((error) => {
  console.error(
    "Failed to start backend:",
    error,
  );

  process.exit(1);
});