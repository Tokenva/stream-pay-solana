import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {
  // Streams table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS streams (
      address TEXT PRIMARY KEY,
      organization TEXT NOT NULL,
      employee TEXT NOT NULL,
      vault TEXT NOT NULL,
      escrow TEXT NOT NULL,
      mint TEXT NOT NULL,
      stream_id BIGINT NOT NULL,
      total_amount BIGINT NOT NULL,
      start_time BIGINT NOT NULL,
      end_time BIGINT NOT NULL,
      claimed_amount BIGINT NOT NULL,
      canceled BOOLEAN NOT NULL,
      cancel_time BIGINT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Stream indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_streams_organization
    ON streams (organization);

    CREATE INDEX IF NOT EXISTS idx_streams_employee
    ON streams (employee);

    CREATE INDEX IF NOT EXISTS idx_streams_canceled
    ON streams (canceled);

    CREATE INDEX IF NOT EXISTS idx_streams_org_employee
    ON streams (organization, employee);
  `);

  // Activities table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id BIGSERIAL PRIMARY KEY,
      signature TEXT NOT NULL,
      instruction_index INTEGER NOT NULL,
      instruction TEXT NOT NULL,
      slot BIGINT NOT NULL,
      block_time BIGINT,
      stream_address TEXT,
      organization TEXT,
      employee TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (signature, instruction_index)
    );
  `);

  // Activity indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_activities_stream
    ON activities (stream_address);

    CREATE INDEX IF NOT EXISTS idx_activities_instruction
    ON activities (instruction);

    CREATE INDEX IF NOT EXISTS idx_activities_employee
    ON activities (employee);

    CREATE INDEX IF NOT EXISTS idx_activities_organization
    ON activities (organization);
  `);
}