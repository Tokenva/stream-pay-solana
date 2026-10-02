import { PublicKey } from "@solana/web3.js";

import { PROGRAM_ID } from "@/lib/anchor";

export const ORGANIZATION_SEED = "organization";
export const VAULT_SEED = "vault";
export const VAULT_AUTHORITY_SEED = "vault-authority";
export const STREAM_SEED = "stream";
export const STREAM_ESCROW_SEED = "stream-escrow";

export const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

export function getOrganizationPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(ORGANIZATION_SEED),
      authority.toBuffer(),
    ],
    PROGRAM_ID,
  );
}

export function getVaultPda(
  organization: PublicKey,
  mint: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(VAULT_SEED),
      organization.toBuffer(),
      mint.toBuffer(),
    ],
    PROGRAM_ID,
  );
}

export function getVaultAuthorityPda(
  organization: PublicKey,
  mint: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(VAULT_AUTHORITY_SEED),
      organization.toBuffer(),
      mint.toBuffer(),
    ],
    PROGRAM_ID,
  );
}

export function getStreamPda(
  organization: PublicKey,
  employee: PublicKey,
  streamId: number,
) {
  const idBuffer = Buffer.alloc(8);
  let value = BigInt(streamId);

  for (let i = 0; i < 8; i += 1) {
    idBuffer[i] = Number(value & BigInt(255));
    value >>= BigInt(8);
  }

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(STREAM_SEED),
      organization.toBuffer(),
      employee.toBuffer(),
      idBuffer,
    ],
    PROGRAM_ID,
  );
}

export function getStreamEscrowPda(
  stream: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(STREAM_ESCROW_SEED),
      stream.toBuffer(),
    ],
    PROGRAM_ID,
  );
}