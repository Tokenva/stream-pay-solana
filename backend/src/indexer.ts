import { pool } from "./db.js";
import { program } from "./solana.js";
export let lastSyncAt: Date | null = null;
export let lastSyncCount = 0;

export async function syncStreams() {
  const accounts =
    await program.account.stream.all();

  for (const { publicKey, account } of accounts) {
    await pool.query(
      `
      INSERT INTO streams (
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
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (address)
      DO UPDATE SET
        organization = EXCLUDED.organization,
        employee = EXCLUDED.employee,
        vault = EXCLUDED.vault,
        escrow = EXCLUDED.escrow,
        mint = EXCLUDED.mint,
        stream_id = EXCLUDED.stream_id,
        total_amount = EXCLUDED.total_amount,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        claimed_amount = EXCLUDED.claimed_amount,
        canceled = EXCLUDED.canceled,
        cancel_time = EXCLUDED.cancel_time,
        updated_at = NOW()
      `,
      [
        publicKey.toBase58(),
        account.organization.toBase58(),
        account.employee.toBase58(),
        account.vault.toBase58(),
        account.escrow.toBase58(),
        account.mint.toBase58(),
        account.streamId.toString(),
        account.totalAmount.toString(),
        account.startTime.toString(),
        account.endTime.toString(),
        account.claimedAmount.toString(),
        account.canceled,
        account.cancelTime.toString(),
      ],
    );
  }

  lastSyncAt = new Date();
  lastSyncCount = accounts.length;

  return accounts.length;
}
