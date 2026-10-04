import { pool } from "./db.js";
import { log } from "./logger.js";

const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

const lastAlertAt = new Map<string, number>();

function shouldAlert(key: string) {
  const now = Date.now();
  const previous = lastAlertAt.get(key) ?? 0;

  if (now - previous < ALERT_COOLDOWN_MS) {
    return false;
  }

  lastAlertAt.set(key, now);
  return true;
}

function emitAlert(
  key: string,
  message: string,
  fields: Record<string, unknown> = {},
) {
  if (!shouldAlert(key)) {
    return;
  }

  log("error", "operational_alert", {
    alertKey: key,
    message,
    ...fields,
  });
}

export async function checkOperationalAlerts(
  lastSyncAt: Date | null,
) {
  try {
    const [
      failedTransactions,
      failedJobs,
      stuckJobs,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::integer AS count
        FROM transactions
        WHERE status = 'failed'
          AND updated_at >= NOW() - INTERVAL '10 minutes'
      `),

      pool.query(`
        SELECT COUNT(*)::integer AS count
        FROM job_queue
        WHERE status = 'failed'
          AND updated_at >= NOW() - INTERVAL '10 minutes'
      `),

      pool.query(`
        SELECT COUNT(*)::integer AS count
        FROM job_queue
        WHERE status = 'running'
          AND locked_at IS NOT NULL
          AND locked_at < NOW() - INTERVAL '10 minutes'
      `),
    ]);

    const failedTransactionCount =
      failedTransactions.rows[0]?.count ?? 0;

    const failedJobCount =
      failedJobs.rows[0]?.count ?? 0;

    const stuckJobCount =
      stuckJobs.rows[0]?.count ?? 0;

    if (failedTransactionCount > 0) {
      emitAlert(
        "failed_transactions",
        "Recent transaction failures detected",
        {
          count: failedTransactionCount,
        },
      );
    }

    if (failedJobCount > 0) {
      emitAlert(
        "failed_jobs",
        "Recent failed queue jobs detected",
        {
          count: failedJobCount,
        },
      );
    }

    if (stuckJobCount > 0) {
      emitAlert(
        "stuck_jobs",
        "Queue jobs have been running for more than 10 minutes",
        {
          count: stuckJobCount,
        },
      );
    }

    if (lastSyncAt) {
      const syncAgeMs =
        Date.now() - lastSyncAt.getTime();

      const syncAgeMinutes =
        syncAgeMs / 60_000;

      if (syncAgeMinutes > 5) {
        emitAlert(
          "stale_indexer",
          "Indexer has not synchronized recently",
          {
            lastSyncAt,
            ageMinutes: Number(
              syncAgeMinutes.toFixed(2),
            ),
          },
        );
      }
    }
  } catch (error) {
    emitAlert(
      "alert_check_failed",
      "Operational alert check failed",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}
