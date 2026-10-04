import { pool } from "./db.js";
import { log } from "./logger.js";

export async function auditLog(input: {
  eventType: string;
  actorType: "api" | "worker" | "system";
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  organization?: string | null;
  employee?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await pool.query(
    `
    INSERT INTO audit_logs (
      event_type,
      actor_type,
      actor_id,
      entity_type,
      entity_id,
      organization,
      employee,
      metadata
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8::jsonb
    )
    `,
    [
      input.eventType,
      input.actorType,
      input.actorId ?? null,
      input.entityType,
      input.entityId ?? null,
      input.organization ?? null,
      input.employee ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  log("info", "audit_event_recorded", {
    eventType: input.eventType,
    actorType: input.actorType,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
  });
}

export async function listAuditLogs(filters: {
  eventType?: string;
  entityType?: string;
  entityId?: string;
  organization?: string;
  limit?: number;
}) {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.eventType) {
    values.push(filters.eventType);
    conditions.push(`event_type = $${values.length}`);
  }

  if (filters.entityType) {
    values.push(filters.entityType);
    conditions.push(`entity_type = $${values.length}`);
  }

  if (filters.entityId) {
    values.push(filters.entityId);
    conditions.push(`entity_id = $${values.length}`);
  }

  if (filters.organization) {
    values.push(filters.organization);
    conditions.push(`organization = $${values.length}`);
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
      event_type,
      actor_type,
      actor_id,
      entity_type,
      entity_id,
      organization,
      employee,
      metadata,
      created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $${values.length}
    `,
    values,
  );

  return result.rows;
}
