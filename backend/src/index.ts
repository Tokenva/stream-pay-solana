import "dotenv/config";

import express from "express";
import cors from "cors";

import { initializeDatabase, pool } from "./db.js";

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

app.use(cors());
app.use(express.json());

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
    service: "streampay-backend",
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

    const { organization, employee, canceled } =
      req.query;

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

app.get("/api/db/streams", async (_req, res) => {
  try {
    const result = await pool.query(`
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
      ORDER BY stream_id ASC
    `);

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
});

app.get("/api/indexed/streams", async (req, res) => {
  try {
    const { organization, employee, canceled } = req.query;

    const conditions: string[] = [];
    const values: string[] = [];

    if (typeof organization === "string") {
      values.push(organization);
      conditions.push(`organization = $${values.length}`);
    }

    if (typeof employee === "string") {
      values.push(employee);
      conditions.push(`employee = $${values.length}`);
    }

    if (typeof canceled === "string") {
      values.push(canceled === "true" ? "true" : "false");
      conditions.push(`canceled = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

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
});

app.get("/api/indexed/streams/:address", async (req, res) => {
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
      `,
      [req.params.address],
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
});


app.get("/api/indexer/status", (_req, res) => {
  res.json({
    status: "running",
    lastSyncAt,
    indexedStreams: lastSyncCount,
  });
});

app.get("/api/activities", async (req, res) => {
  try {
    const {
      stream,
      employee,
      organization,
    } = req.query;

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

    const conditions: string[] = [];
    const values: Array<string | number> = [];

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

    if (typeof organization === "string") {
      values.push(organization);
      conditions.push(
        `organization = $${values.length}`,
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

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
});

app.get("/api/activities/stats", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        instruction,
        COUNT(*)::integer AS count
      FROM activities
      GROUP BY instruction
      ORDER BY count DESC
    `);

    const totalResult = await pool.query(`
      SELECT COUNT(*)::integer AS count
      FROM activities
    `);

    res.json({
      total: totalResult.rows[0]?.count ?? 0,
      byInstruction: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch activity stats",
    });
  }
});


app.post("/api/transactions", async (req, res) => {
  try {
    const {
      signature,
      action,
      organization = null,
      employee = null,
    } = req.body ?? {};

    if (
      typeof signature !== "string" ||
      !signature.trim()
    ) {
      return res.status(400).json({
        error: "signature is required",
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

    const result = await pool.query(
      `
      INSERT INTO transactions (
        signature,
        action,
        status,
        organization,
        employee,
        updated_at
      )
      VALUES ($1, $2, 'submitted', $3, $4, NOW())
      ON CONFLICT (signature)
      DO UPDATE SET
        action = EXCLUDED.action,
        organization = EXCLUDED.organization,
        employee = EXCLUDED.employee,
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
        signature.trim(),
        action.trim(),
        organization,
        employee,
      ],
    );

    await auditLog({
      eventType: "transaction_registered",
      actorType: "api",
      entityType: "transaction",
      entityId: signature.trim(),
      organization,
      employee,
      metadata: {
        action: action.trim(),
        status: result.rows[0]?.status ?? "submitted",
      },
    });

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to register transaction",
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

async function reconcileTransactionStatuses() {
  if (transactionStatusCheckRunning) {
    return;
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
      return;
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

        continue;
      }

      if (
        status.confirmationStatus ===
        "confirmed" ||
        status.confirmationStatus ===
        "finalized"
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
      }
    }
  } catch (error) {
    log("error", "transaction_reconciliation_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  } finally {
    transactionStatusCheckRunning = false;
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
      service: "streampay-backend",
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
    log("error", "webhook_registration_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

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

async function startServer() {
  await initializeDatabase();

  const count = await syncStreams();

  log("info", "initial_stream_index", {
    indexedStreams: count,
  });

  startActivitySubscription();

  void recoverStaleJobs();
  void runQueueWorker();

  void reconcileTransactionStatuses();

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
    void runQueueWorker();
    void reconcileTransactionStatuses();
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
      `StreamPay backend running at http://localhost:${port}`,
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