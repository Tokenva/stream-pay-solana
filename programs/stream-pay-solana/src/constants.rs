use anchor_lang::prelude::*;

#[constant]
pub const PROTOCOL_CONFIG_SEED: &[u8] = b"protocol";

#[constant]
pub const ORGANIZATION_SEED: &[u8] = b"organization";
pub const ORGANIZATION_ROLES_SEED: &[u8] = b"organization_roles";

#[constant]
pub const ORGANIZATION_POLICY_SEED: &[u8] = b"organization_policy";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const VAULT_AUTHORITY_SEED: &[u8] = b"vault-authority";

#[constant]
pub const STREAM_SEED: &[u8] = b"stream";

#[constant]
pub const STREAM_ESCROW_SEED: &[u8] = b"stream-escrow";

#[constant]
pub const CROSS_CHAIN_CONFIG_SEED: &[u8] = b"cross-chain";

#[constant]
pub const CONSUMED_VAA_SEED: &[u8] = b"vaa";

#[constant]
pub const PROTOCOL_VERSION: u8 = 1;

#[constant]
pub const WORMHOLE_SEPOLIA_CHAIN_ID: u16 = 10002;

#[constant]
pub const WORMHOLE_SOLANA_CHAIN_ID: u16 = 1;

#[constant]
pub const CROSS_CHAIN_STREAM_SEED: &[u8] = b"cross-stream";

#[constant]
pub const CROSS_CHAIN_ASSET_CONFIG_SEED: &[u8] = b"cross-chain-asset";
