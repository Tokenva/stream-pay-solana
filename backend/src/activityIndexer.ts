import { pool } from "./db.js";
import {
  connection,
  PROGRAM_ID,
} from "./solana.js";

let activitySubscriptionId: number | null = null;

const INVALID_SIGNATURE =
  "1111111111111111111111111111111111111111111111111111111111111111";

function extractInstructions(logs: string[]) {
  return logs
    .filter((log) =>
      log.includes("Program log: Instruction:"),
    )
    .map((log) =>
      log
        .split("Program log: Instruction:")[1]
        ?.trim(),
    )
    .filter(
      (instruction): instruction is string =>
        Boolean(instruction),
    );
}

async function indexActivity(
  signature: string,
  slot: number,
  blockTime: number | null,
  instruction: string,
  instructionIndex: number,
  accounts: string[],
) {
  let streamAddress: string | null = null;
  let organization: string | null = null;
  let employee: string | null = null;

  switch (instruction) {
    case "Deposit":
    case "deposit":
      organization = accounts[1] ?? null;
      break;

    case "CreateOrganization":
    case "createOrganization":
      organization = accounts[1] ?? null;
      break;

    case "InitializeVault":
    case "initializeVault":
      organization = accounts[1] ?? null;
      break;

    case "CreateStream":
    case "createStream":
      organization = accounts[1] ?? null;
      employee = accounts[2] ?? null;
      streamAddress = accounts[6] ?? null;
      break;

    case "Claim":
    case "claim":
      employee = accounts[0] ?? null;
      streamAddress = accounts[1] ?? null;
      break;

    case "TopUpStream":
    case "topUpStream":
      organization = accounts[1] ?? null;
      employee = accounts[2] ?? null;
      streamAddress = accounts[6] ?? null;
      break;

    case "CancelStream":
    case "cancelStream":
      organization = accounts[1] ?? null;
      employee = accounts[2] ?? null;
      streamAddress = accounts[3] ?? null;
      break;

    default:
      break;
  }

  // Resolve organization and employee from the indexed stream.
  // Claim instructions do not directly populate organization.
  if (streamAddress) {
    const streamResult = await pool.query(
      `
      SELECT organization, employee
      FROM streams
      WHERE address = $1
      LIMIT 1
      `,
      [streamAddress],
    );

    const indexedStream = streamResult.rows[0];

    if (indexedStream) {
      organization ??= indexedStream.organization;
      employee ??= indexedStream.employee;
    }
  }

  const result = await pool.query(
    `
    INSERT INTO activities (
      signature,
      instruction_index,
      instruction,
      slot,
      block_time,
      stream_address,
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
    ON CONFLICT (
      signature,
      instruction_index
    )
    DO UPDATE SET
      instruction = EXCLUDED.instruction,
      slot = EXCLUDED.slot,
      block_time = EXCLUDED.block_time,
      stream_address = EXCLUDED.stream_address,
      organization = EXCLUDED.organization,
      employee = EXCLUDED.employee
    RETURNING id
    `,
    [
      signature,
      instructionIndex,
      instruction,
      slot,
      blockTime,
      streamAddress,
      organization,
      employee,
    ],
  );

  return result.rowCount ?? 0;
}

export function startActivitySubscription() {
  if (activitySubscriptionId !== null) {
    console.log(
      "Activity subscription already running",
    );
    return;
  }

  activitySubscriptionId = connection.onLogs(
    PROGRAM_ID,
    async (logInfo, context) => {
      if (logInfo.err) {
        return;
      }

      if (
        logInfo.signature === INVALID_SIGNATURE
      ) {
        return;
      }

      try {
        const instructions =
          extractInstructions(logInfo.logs);

        if (instructions.length === 0) {
          return;
        }

        console.log(
          `Program activity detected: ${logInfo.signature}`,
        );

        const transaction =
          await connection.getParsedTransaction(
            logInfo.signature,
            {
              maxSupportedTransactionVersion: 0,
              commitment: "confirmed",
            },
          );

        if (!transaction) {
          console.log(
            `Transaction not available yet: ${logInfo.signature}`,
          );
          return;
        }

        const programInstructions =
          transaction.transaction.message.instructions.filter(
            (instruction) =>
              "programId" in instruction &&
              instruction.programId.equals(
                PROGRAM_ID,
              ) &&
              "accounts" in instruction,
          );

        let indexed = 0;

        for (
          let instructionIndex = 0;
          instructionIndex <
          programInstructions.length;
          instructionIndex++
        ) {
          const instruction =
            programInstructions[instructionIndex];

          if (!("accounts" in instruction)) {
            continue;
          }

          const accounts =
            instruction.accounts.map(
              (account) =>
                account.toBase58(),
            );

          const instructionName =
            instructions[instructionIndex];

          if (!instructionName) {
            continue;
          }

          indexed += await indexActivity(
            logInfo.signature,
            context.slot,
            transaction.blockTime ?? null,
            instructionName,
            instructionIndex,
            accounts,
          );
        }

        if (indexed > 0) {
          console.log(
            `Indexed ${indexed} activities from ${logInfo.signature}`,
          );
        }
      } catch (error) {
        console.error(
          "Activity subscription error:",
          error,
        );
      }
    },
    "confirmed",
  );

  console.log(
    `Activity subscription started: ${activitySubscriptionId}`,
  );
}