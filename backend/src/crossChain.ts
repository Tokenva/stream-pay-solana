import { pool } from "./db.js";
import { auditLog } from "./audit.js";
import { log } from "./logger.js";

const VALID_STATUSES = [
  "created",
  "submitted",
  "source_confirmed",
  "message_observed",
  "vaa_available",
  "destination_submitted",
  "destination_confirmed",
  "failed",
] as const;

type CrossChainStatus = (typeof VALID_STATUSES)[number];

function isCrossChainStatus(
  value: string,
): value is CrossChainStatus {
  return VALID_STATUSES.includes(
    value as CrossChainStatus,
  );
}

const ALLOWED_STATUS_TRANSITIONS: Record<
  CrossChainStatus,
  readonly CrossChainStatus[]
> = {
  created: ["submitted", "failed"],
  submitted: ["source_confirmed", "failed"],
  source_confirmed: ["message_observed", "failed"],
  message_observed: ["vaa_available", "failed"],
  vaa_available: ["destination_submitted", "failed"],
  destination_submitted: [
    "destination_confirmed",
    "failed",
  ],
  destination_confirmed: [],
  failed: [],
};

export async function registerCrossChainMessage(input: {
  gatewayTxHash: string;
  action: string;
  operationId: string;
  wormholeSequence?: string | null;
  sourceChain?: number;
  destinationChain?: number;
  organization?: string | null;
  employee?: string | null;
}) {
  const result = await pool.query(
    `
    INSERT INTO cross_chain_messages (
      gateway_tx_hash,
      action,
      operation_id,
      wormhole_sequence,
      source_chain,
      destination_chain,
      organization,
      employee
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8
    )
    ON CONFLICT (gateway_tx_hash)
    DO UPDATE SET
      action = EXCLUDED.action,
      operation_id = EXCLUDED.operation_id,
      wormhole_sequence = EXCLUDED.wormhole_sequence,
      source_chain = EXCLUDED.source_chain,
      destination_chain = EXCLUDED.destination_chain,
      organization = EXCLUDED.organization,
      employee = EXCLUDED.employee,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      input.gatewayTxHash.trim(),
      input.action.trim(),
      input.operationId.trim(),
      input.wormholeSequence ?? null,
      input.sourceChain ?? 10002,
      input.destinationChain ?? 1,
      input.organization ?? null,
      input.employee ?? null,
    ],
  );

  const row = result.rows[0];

  await auditLog({
    eventType: "cross_chain_message_registered",
    actorType: "api",
    entityType: "cross_chain_message",
    entityId: String(row.id),
    organization: row.organization,
    employee: row.employee,
    metadata: {
      gatewayTxHash: row.gateway_tx_hash,
      action: row.action,
      operationId: row.operation_id,
      wormholeSequence:
        row.wormhole_sequence?.toString() ?? null,
      sourceChain: row.source_chain,
      destinationChain:
        row.destination_chain,
      status: row.status,
    },
  });

  return row;
}

export async function listCrossChainMessages(filters: {
  status?: string;
  operationId?: string;
  organization?: string;
  employee?: string;
  limit?: number;
}) {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.status) {
    if (!isCrossChainStatus(filters.status)) {
      throw new Error(
        `Invalid cross-chain status: ${filters.status}`,
      );
    }

    values.push(filters.status);
    conditions.push(
      `status = $${values.length}`,
    );
  }

  if (filters.operationId) {
    values.push(filters.operationId);
    conditions.push(
      `operation_id = $${values.length}`,
    );
  }

  if (filters.organization) {
    values.push(filters.organization);
    conditions.push(
      `organization = $${values.length}`,
    );
  }

  if (filters.employee) {
    values.push(filters.employee);
    conditions.push(
      `employee = $${values.length}`,
    );
  }

  const limit = Math.min(
    Math.max(filters.limit ?? 50, 1),
    200,
  );

  values.push(limit);

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const result = await pool.query(
    `
    SELECT
      id,
      gateway_tx_hash,
      action,
      operation_id,
      wormhole_sequence,
      source_chain,
      destination_chain,
      organization,
      employee,
      vaa_id,
      consume_tx_hash,
      destination_tx_hash,
      status,
      error,
      created_at,
      updated_at,
      completed_at
    FROM cross_chain_messages
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $${values.length}
    `,
    values,
  );

  return result.rows;
}

export async function getCrossChainMessage(
  id: string,
) {
  const result = await pool.query(
    `
    SELECT
      id,
      gateway_tx_hash,
      action,
      operation_id,
      wormhole_sequence,
      source_chain,
      destination_chain,
      organization,
      employee,
      vaa_id,
      consume_tx_hash,
      destination_tx_hash,
      status,
      error,
      created_at,
      updated_at,
      completed_at
    FROM cross_chain_messages
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function updateCrossChainMessageStatus(input: {
  id: string;
  status: string;
  vaaId?: string | null;
  consumeTxHash?: string | null;
  destinationTxHash?: string | null;
  error?: string | null;
}) {
  if (!isCrossChainStatus(input.status)) {
    throw new Error(
      `Invalid cross-chain status: ${input.status}`,
    );
  }

  const currentResult = await pool.query(
    `
    SELECT *
    FROM cross_chain_messages
    WHERE id = $1
    `,
    [input.id],
  );

  const currentRow = currentResult.rows[0];

  if (!currentRow) {
    return null;
  }

  const currentStatus =
    currentRow.status as CrossChainStatus;

  const allowedNextStatuses =
    ALLOWED_STATUS_TRANSITIONS[currentStatus];

  if (!allowedNextStatuses.includes(input.status)) {
    throw new Error(
      `Invalid cross-chain status transition: ${currentStatus} -> ${input.status}`,
    );
  }

  const result = await pool.query(
    `
    UPDATE cross_chain_messages
    SET
      status = $2,
      vaa_id = COALESCE($3, vaa_id),
      consume_tx_hash = COALESCE($4, consume_tx_hash),
      destination_tx_hash =
        COALESCE($5, destination_tx_hash),
      error = CASE
        WHEN $2 = 'failed' THEN $6
        ELSE NULL
      END,
      updated_at = NOW(),
      completed_at = CASE
        WHEN $2 = 'destination_confirmed'
          THEN COALESCE(completed_at, NOW())
        ELSE completed_at
      END
    WHERE id = $1
    RETURNING *;
    `,
    [
      input.id,
      input.status,
      input.vaaId ?? null,
      input.consumeTxHash ?? null,
      input.destinationTxHash ?? null,
      input.error ?? null,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  await auditLog({
    eventType:
      input.status === "failed"
        ? "cross_chain_message_failed"
        : "cross_chain_message_status_updated",
    actorType: "api",
    entityType: "cross_chain_message",
    entityId: String(row.id),
    organization: row.organization,
    employee: row.employee,
    metadata: {
      gatewayTxHash:
        row.gateway_tx_hash,
      operationId:
        row.operation_id,
      wormholeSequence:
        row.wormhole_sequence?.toString() ?? null,
      status: row.status,
      vaaId: row.vaa_id,
      consumeTxHash:
        row.consume_tx_hash,
      destinationTxHash:
        row.destination_tx_hash,
      error: row.error,
    },
  });

  log("info", "cross_chain_message_status", {
    id: row.id,
    operationId: row.operation_id,
    status: row.status,
  });

  return row;
}