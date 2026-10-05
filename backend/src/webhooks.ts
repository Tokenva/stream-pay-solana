import crypto from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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

function isBlockedIp(ip: string) {
  if (isIP(ip) === 4) {
    const parts = ip
      .split(".")
      .map((part) => Number(part));

    const [a, b] = parts;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && b >= 18 && b <= 19) ||
      a >= 224
    );
  }

  if (isIP(ip) === 6) {
    const normalized = ip.toLowerCase();

    if (
      normalized === "::" ||
      normalized === "::1"
    ) {
      return true;
    }

    const firstHextet = Number.parseInt(
      normalized.split(":")[0] || "0",
      16,
    );

    return (
      (firstHextet >= 0xfc00 &&
        firstHextet <= 0xfdff) ||
      (firstHextet >= 0xfe80 &&
        firstHextet <= 0xfebf)
    );
  }

  return true;
}

async function validateWebhookUrl(url: string) {
  const parsed = new URL(url);

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "Webhook URL must use HTTP or HTTPS",
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      "Webhook URL must not contain credentials",
    );
  }

  const hostname = parsed.hostname
    .trim()
    .toLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error(
      "Webhook URL must target a public host",
    );
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (addresses.length === 0) {
    throw new Error(
      "Webhook hostname could not be resolved",
    );
  }

  for (const address of addresses) {
    if (isBlockedIp(address.address)) {
      throw new Error(
        "Webhook URL must not resolve to a private or reserved address",
      );
    }
  }
}

export async function registerWebhook(
  url: string,
) {
  await validateWebhookUrl(url);

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
    await validateWebhookUrl(
      delivery.url,
    );

    const response = await fetch(
      delivery.url,
      {
        method: "POST",
        redirect: "error",
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
