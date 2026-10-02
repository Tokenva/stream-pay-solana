use anchor_lang::prelude::*;

#[constant]
pub const PROTOCOL_CONFIG_SEED: &[u8] = b"protocol";

#[constant]
pub const ORGANIZATION_SEED: &[u8] = b"organization";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const VAULT_AUTHORITY_SEED: &[u8] = b"vault-authority";

#[constant]
pub const PROTOCOL_VERSION: u8 = 1;

#[constant]
pub const STREAM_SEED: &[u8] = b"stream";

#[constant]
pub const STREAM_ESCROW_SEED: &[u8] = b"stream-escrow";
