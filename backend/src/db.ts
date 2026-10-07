import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (process.env.DEBUG_DATABASE_URL === "true") {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  console.log("DATABASE CONFIG", {
    user: databaseUrl.username,
    host: databaseUrl.hostname,
    port: databaseUrl.port,
    database: databaseUrl.pathname,
    hasPassword: Boolean(databaseUrl.password),
  });
}

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

  // Webhook endpoints
  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id BIGSERIAL PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      secret TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active
    ON webhook_endpoints (active);
  `);

  // Webhook delivery history
  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id BIGSERIAL PRIMARY KEY,
      webhook_id BIGINT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_id TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      response_status INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      delivered_at TIMESTAMPTZ,
      UNIQUE (webhook_id, event_type, event_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status
    ON webhook_deliveries (status);

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
    ON webhook_deliveries (webhook_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created
    ON webhook_deliveries (created_at DESC);
  `);

  // Audit log
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      organization TEXT,
      employee TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_event
    ON audit_logs (event_type, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs (entity_type, entity_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_organization
    ON audit_logs (organization, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC);
  `);

  // Transaction status table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      signature TEXT NOT NULL UNIQUE,
      action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      organization TEXT,
      employee TEXT,
      slot BIGINT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confirmed_at TIMESTAMPTZ
    );
  `);

  // Persistent background job queue
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id BIGSERIAL PRIMARY KEY,
      job_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locked_at TIMESTAMPTZ,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_job_queue_ready
    ON job_queue (status, run_after, id);

    CREATE INDEX IF NOT EXISTS idx_job_queue_type
    ON job_queue (job_type, status);
  `);

  // Transaction indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transactions_status
    ON transactions (status);

    CREATE INDEX IF NOT EXISTS idx_transactions_organization
    ON transactions (organization);

    CREATE INDEX IF NOT EXISTS idx_transactions_employee
    ON transactions (employee);

    CREATE INDEX IF NOT EXISTS idx_transactions_created_at
    ON transactions (created_at DESC);
  `);

  // Cross-chain message tracking
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cross_chain_messages (
      id BIGSERIAL PRIMARY KEY,
      gateway_tx_hash TEXT NOT NULL UNIQUE,
      action TEXT NOT NULL,
      operation_id TEXT NOT NULL,
      wormhole_sequence NUMERIC(78, 0),
      source_chain INTEGER NOT NULL DEFAULT 10002,
      destination_chain INTEGER NOT NULL DEFAULT 1,
      organization TEXT,
      employee TEXT,
      vaa_id TEXT,
      consume_tx_hash TEXT,
      destination_tx_hash TEXT,
      status TEXT NOT NULL DEFAULT 'created'
        CHECK (
          status IN (
            'created',
            'submitted',
            'source_confirmed',
            'message_observed',
            'vaa_available',
            'destination_submitted',
            'destination_confirmed',
            'failed'
          )
        ),
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_cross_chain_messages_status
    ON cross_chain_messages (status, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_cross_chain_messages_operation
    ON cross_chain_messages (operation_id);

    CREATE INDEX IF NOT EXISTS idx_cross_chain_messages_organization
    ON cross_chain_messages (organization, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_cross_chain_messages_employee
    ON cross_chain_messages (employee, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_cross_chain_messages_created
    ON cross_chain_messages (created_at DESC);
  `);
}

// Wallet authentication nonces
await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_nonces (
      id BIGSERIAL PRIMARY KEY,
      wallet TEXT NOT NULL,
      nonce TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet
    ON auth_nonces (wallet);

    CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires
    ON auth_nonces (expires_at);
  `);

// Wallet authentication sessions
await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id BIGSERIAL PRIMARY KEY,
      wallet TEXT NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_wallet
    ON auth_sessions (wallet);

    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
    ON auth_sessions (expires_at);
  `);

// Tokenva companies
await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      treasury_wallet TEXT,
      created_by TEXT NOT NULL,
      pilot_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
          pilot_status IN (
            'pending',
            'approved',
            'active',
            'expired',
            'rejected'
          )
        ),
      pilot_start TIMESTAMPTZ,
      pilot_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_companies_created_by
    ON companies (created_by);

    CREATE INDEX IF NOT EXISTS idx_companies_pilot_status
    ON companies (pilot_status);
  `);

// Tokenva company members
await pool.query(`
    CREATE TABLE IF NOT EXISTS company_members (
      id BIGSERIAL PRIMARY KEY,
      company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,
      wallet TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner'
        CHECK (
          role IN (
            'owner',
            'admin',
            'finance',
            'approver',
            'viewer',
            'employee'
          )
        ),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (company_id, wallet)
    );
  `);

await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_company_members_wallet
    ON company_members (wallet);

    CREATE INDEX IF NOT EXISTS idx_company_members_company
    ON company_members (company_id);
  `);

// Tokenva pilot applications
await pool.query(`
    CREATE TABLE IF NOT EXISTS pilot_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      wallet TEXT NOT NULL UNIQUE,

      company_name TEXT NOT NULL,
      company_website TEXT NOT NULL,
      work_email TEXT NOT NULL,
      country TEXT NOT NULL,
      team_size INTEGER NOT NULL CHECK (team_size > 0),

      monthly_stablecoin_payroll_volume TEXT NOT NULL,

      primary_use_case TEXT NOT NULL,
      why_tokenva TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
          status IN (
            'pending',
            'approved',
            'rejected'
          )
        ),

      rejection_reason TEXT,

      company_id UUID
        REFERENCES companies(id)
        ON DELETE SET NULL,

      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_pilot_applications_status
    ON pilot_applications (status);

    CREATE INDEX IF NOT EXISTS idx_pilot_applications_created
    ON pilot_applications (created_at DESC);
  `);