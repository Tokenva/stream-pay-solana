use anchor_lang::prelude::*;
use solana_keccak_hasher as keccak;

declare_program!(wormhole_verify_vaa_shim);

use wormhole_verify_vaa_shim::cpi::accounts::VerifyHash;
use wormhole_verify_vaa_shim::program::WormholeVerifyVaaShim;

use crate::{
    constants::{
        CONSUMED_VAA_SEED, CROSS_CHAIN_CONFIG_SEED, WORMHOLE_SEPOLIA_CHAIN_ID,
        WORMHOLE_SOLANA_CHAIN_ID,
    },
    error::StreamPayError,
    state::{ConsumedVaa, CrossChainConfig, ProtocolConfig},
};

#[event]
pub struct CrossChainMessageConsumed {
    pub emitter_chain: u16,
    pub sequence: u64,
    pub action: u8,
    pub operation_id: [u8; 32],
    pub stream_id: [u8; 32],
    pub amount: u64,
    pub start_time: u64,
    pub end_time: u64,
}

#[derive(Accounts)]
pub struct InitializeCrossChainConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
        constraint = protocol_config.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + CrossChainConfig::INIT_SPACE,
        seeds = [CROSS_CHAIN_CONFIG_SEED],
        bump
    )]
    pub cross_chain_config: Account<'info, CrossChainConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_cross_chain_config(
    ctx: Context<InitializeCrossChainConfig>,
    source_emitter: [u8; 32],
) -> Result<()> {
    require!(
        source_emitter != [0u8; 32],
        StreamPayError::InvalidCrossChainConfig
    );

    let config = &mut ctx.accounts.cross_chain_config;

    config.authority = ctx.accounts.authority.key();

    config.source_chain = WORMHOLE_SEPOLIA_CHAIN_ID;

    config.source_emitter = source_emitter;

    config.bump = ctx.bumps.cross_chain_config;

    config.created_at = Clock::get()?.unix_timestamp;

    msg!("Cross-chain configuration initialized");

    msg!("Source chain: {}", config.source_chain);

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    guardian_set_bump: u8,
    sequence: u64,
    vaa_body: Vec<u8>
)]
pub struct ConsumeVaa<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [CROSS_CHAIN_CONFIG_SEED],
        bump = cross_chain_config.bump
    )]
    pub cross_chain_config: Account<'info, CrossChainConfig>,

    /// CHECK:
    /// Guardian set derivation and validity are checked
    /// by the Wormhole verification shim.
    pub guardian_set: UncheckedAccount<'info>,

    /// CHECK:
    /// This account is created by post_signatures()
    /// and validated by the Wormhole verification shim.
    pub guardian_signatures: UncheckedAccount<'info>,

    pub wormhole_verify_vaa_shim: Program<'info, WormholeVerifyVaaShim>,

    #[account(
        init,
        payer = payer,
        space = 8 + ConsumedVaa::INIT_SPACE,
        seeds = [
            CONSUMED_VAA_SEED,
            cross_chain_config.source_emitter.as_ref(),
            sequence.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub consumed_vaa: Account<'info, ConsumedVaa>,

    pub system_program: Program<'info, System>,
}

pub fn handle_consume_vaa(
    ctx: Context<ConsumeVaa>,
    guardian_set_bump: u8,
    sequence: u64,
    vaa_body: Vec<u8>,
) -> Result<()> {
    /*
     * Wormhole VAA body:
     *
     * timestamp        4 bytes
     * nonce            4 bytes
     * emitter_chain    2 bytes
     * emitter_address 32 bytes
     * sequence         8 bytes
     * consistency      1 byte
     * payload          remaining bytes
     */

    require!(vaa_body.len() >= 51, StreamPayError::InvalidVaaBody);

    let emitter_chain = u16::from_be_bytes([vaa_body[8], vaa_body[9]]);

    let mut emitter_address = [0u8; 32];

    emitter_address.copy_from_slice(&vaa_body[10..42]);

    let body_sequence = u64::from_be_bytes([
        vaa_body[42],
        vaa_body[43],
        vaa_body[44],
        vaa_body[45],
        vaa_body[46],
        vaa_body[47],
        vaa_body[48],
        vaa_body[49],
    ]);

    require!(
        body_sequence == sequence,
        StreamPayError::InvalidVaaSequence
    );

    require!(
        emitter_chain == ctx.accounts.cross_chain_config.source_chain,
        StreamPayError::InvalidVaaSourceChain
    );

    require!(
        emitter_address == ctx.accounts.cross_chain_config.source_emitter,
        StreamPayError::InvalidVaaEmitter
    );

    /*
     * Wormhole V1 digest:
     *
     * keccak256(
     *     keccak256(
     *         vaa_body
     *     )
     * )
     *
     * This follows Wormhole's current verification
     * shim example.
     */

    let message_hash = keccak::hash(&vaa_body).to_bytes();

    let digest = keccak::hash(&message_hash).to_bytes();

    /*
     * Verify Guardian signatures through the
     * canonical Wormhole verification shim.
     *
     * Anchor 1.2 CpiContext::new() expects
     * the target program's Pubkey.
     */

    wormhole_verify_vaa_shim::cpi::verify_hash(
        CpiContext::new(
            ctx.accounts.wormhole_verify_vaa_shim.key(),
            VerifyHash {
                guardian_set: ctx.accounts.guardian_set.to_account_info(),

                guardian_signatures: ctx.accounts.guardian_signatures.to_account_info(),
            },
        ),
        guardian_set_bump,
        digest,
    )?;

    /*
     * Everything after the first 51 bytes is
     * our Tokenva application payload.
     */

    let payload = &vaa_body[51..];

    /*
     * Our EVM gateway ABI-encodes 13 words:
     *
     * 13 * 32 = 416 bytes
     */

    require!(payload.len() == 416, StreamPayError::InvalidVaaPayload);

    let version = payload[31];

    require!(version == 1, StreamPayError::InvalidVaaVersion);

    let action = payload[63];

    require!(action <= 2, StreamPayError::InvalidVaaAction);

    let source_chain = u16::from_be_bytes([payload[94], payload[95]]);

    let destination_chain = u16::from_be_bytes([payload[126], payload[127]]);

    require!(
        source_chain == WORMHOLE_SEPOLIA_CHAIN_ID,
        StreamPayError::InvalidVaaSourceChain
    );

    require!(
        destination_chain == WORMHOLE_SOLANA_CHAIN_ID,
        StreamPayError::InvalidVaaDestination
    );

    let mut operation_id = [0u8; 32];

    operation_id.copy_from_slice(&payload[128..160]);

    let mut destination_program = [0u8; 32];

    destination_program.copy_from_slice(&payload[160..192]);

    require!(
        destination_program == crate::ID.to_bytes(),
        StreamPayError::InvalidVaaDestination
    );

    let mut stream_id = [0u8; 32];

    stream_id.copy_from_slice(&payload[256..288]);

    let amount = decode_u64_word(&payload[288..320])?;

    let start_time = decode_u64_word(&payload[320..352])?;

    let end_time = decode_u64_word(&payload[352..384])?;

    require!(operation_id != [0u8; 32], StreamPayError::InvalidVaaPayload);

    require!(stream_id != [0u8; 32], StreamPayError::InvalidVaaPayload);

    require!(start_time < end_time, StreamPayError::InvalidVaaPayload);

    let payload_hash = keccak::hash(payload).to_bytes();

    let consumed = &mut ctx.accounts.consumed_vaa;

    consumed.emitter_chain = emitter_chain;

    consumed.emitter_address = emitter_address;

    consumed.sequence = sequence;

    consumed.action = action;

    consumed.operation_id = operation_id;

    consumed.stream_id = stream_id;

    consumed.amount = amount;

    consumed.start_time = start_time;

    consumed.end_time = end_time;

    consumed.payload_hash = payload_hash;

    consumed.consumed_at = Clock::get()?.unix_timestamp;

    consumed.bump = ctx.bumps.consumed_vaa;

    emit!(CrossChainMessageConsumed {
        emitter_chain,
        sequence,
        action,
        operation_id,
        stream_id,
        amount,
        start_time,
        end_time,
    });

    msg!("Tokenva cross-chain VAA consumed");

    msg!("Sequence: {}", sequence);

    msg!("Action: {}", action);

    Ok(())
}

fn decode_u64_word(word: &[u8]) -> Result<u64> {
    require!(word.len() == 32, StreamPayError::InvalidVaaPayload);

    require!(
        word[..24].iter().all(|byte| *byte == 0),
        StreamPayError::InvalidVaaPayload
    );

    let mut value = [0u8; 8];

    value.copy_from_slice(&word[24..32]);

    Ok(u64::from_be_bytes(value))
}
