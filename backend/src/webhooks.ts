import crypto from "node:crypto";

import { pool } from "./db.js";
import { log } from "./logger.js";

function createSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function signPayload(
  secret: string,
  timestamp: string,
  body: string,
) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export async function registerWebhook(
  url: string,
) {
  const secret = createSecret();

  const result = await pool.query(
    `
    INSERT INTO webhook_endpoints (
      url,
      secret
    )
    VALUES ($1, $2)
    RETURNING id, url, active, created_at
    `,
    [url, secret],
  );

  return {
    ...result.rows[0],
    secret,
  };
}

export async function listWebhooks() {
  const result = await pool.query(`
    SELECT
      id,
      url,
      active,
      created_at,
      updated_at
    FROM webhook_endpoints
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function deleteWebhook(
  id: number,
) {
  const result = await pool.query(
    `
    DELETE FROM webhook_endpoints
    WHERE id = $1
    RETURNING id
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function queueWebhookEvent(
  eventType: string,
  eventId: string,
  payload: Record<string, unknown>,
) {
  const endpoints = await pool.query(`
    SELECT
      id
    FROM webhook_endpoints
    WHERE active = TRUE
  `);

  let queued = 0;

  for (const endpoint of endpoints.rows) {
    const delivery = await pool.query(
      `
      INSERT INTO webhook_deliveries (
        webhook_id,
        event_type,
        event_id,
        payload
      )
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (
        webhook_id,
        event_type,
        event_id
      )
      DO NOTHING
      RETURNING id
      `,
      [
        endpoint.id,
        eventType,
        eventId,
        JSON.stringify(payload),
      ],
    );

    if (delivery.rows.length === 0) {
      continue;
    }

    await pool.query(
      `
      INSERT INTO job_queue (
        job_type,
        payload,
        updated_at
      )
      VALUES (
        'webhook_delivery',
        $1::jsonb,
        NOW()
      )
      `,
      [
        JSON.stringify({
          deliveryId: delivery.rows[0].id,
        }),
      ],
    );

    queued += 1;
  }

  if (queued > 0) {
    log("info", "webhook_events_queued", {
      eventType,
      eventId,
      deliveries: queued,
    });
  }

  return queued;
}

export async function deliverWebhook(
  deliveryId: number,
) {
  const result = await pool.query(
    `
    SELECT
      d.id,
      d.event_type,
      d.event_id,
      d.payload,
      d.attempts,
      w.url,
      w.secret
    FROM webhook_deliveries d
    JOIN webhook_endpoints w
      ON w.id = d.webhook_id
    WHERE d.id = $1
      AND w.active = TRUE
  `,
    [deliveryId],
  );

  const delivery = result.rows[0];

  if (!delivery) {
    return {
      completed: true,
    };
  }

  const timestamp = Date.now().toString();

  const body = JSON.stringify({
    id: delivery.event_id,
    type: delivery.event_type,
    timestamp: new Date().toISOString(),
    data: delivery.payload,
  });

  const signature = signPayload(
    delivery.secret,
    timestamp,
    body,
  );

  try {
    const response = await fetch(
      delivery.url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-streampay-timestamp": timestamp,
          "x-streampay-signature": `sha256=${signature}`,
          "user-agent": "StreamPay-Webhook/1.0",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Webhook returned HTTP ${response.status}`,
      );
    }

    await pool.query(
      `
      UPDATE webhook_deliveries
      SET
        status = 'delivered',
        attempts = attempts + 1,
        response_status = $2,
        last_error = NULL,
        updated_at = NOW(),
        delivered_at = NOW()
      WHERE id = $1
      `,
      [deliveryId, response.status],
    );

    log("info", "webhook_delivered", {
      deliveryId,
      eventType: delivery.event_type,
      eventId: delivery.event_id,
      responseStatus: response.status,
    });

    return {
      completed: true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    await pool.query(
      `
      UPDATE webhook_deliveries
      SET
        status = 'pending',
        attempts = attempts + 1,
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [deliveryId, message],
    );

    throw error;
  }
}
