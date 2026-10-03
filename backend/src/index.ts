import "dotenv/config";
import { initializeDatabase } from "./db.js";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import {
  syncStreams,
  lastSyncAt,
  lastSyncCount,
} from "./indexer.js";
import {
  startActivitySubscription,
} from "./activityIndexer.js";

import { PublicKey } from "@solana/web3.js";

import { program } from "./solana.js";

const app = express();

app.use(cors());
app.use(express.json());

const port = Number(
  process.env.PORT ?? 4000,
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "streampay-backend",
  });
});

app.get("/api/streams", async (req, res) => {
  try {
    const accounts =
      await program.account.stream.all();

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
        await program.account.stream.fetch(
          address,
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

    const conditions: string[] = [];
    const values: string[] = [];

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
        created_at
      FROM activities
      ${whereClause}
      ORDER BY slot DESC
      `,
      values,
    );

    res.json({
      count: result.rows.length,
      activities: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch activities",
    });
  }
});

async function startServer() {
  await initializeDatabase();

  const count = await syncStreams();

  console.log(
    `Indexed ${count} streams`,
  );

  startActivitySubscription();

  setInterval(async () => {
    try {
      const count = await syncStreams();

      console.log(
        `Re-indexed ${count} streams`,
      );
    } catch (error) {
      console.error(
        "Indexer sync failed:",
        error,
      );
    }
  }, 60_000);

  app.listen(port, () => {
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