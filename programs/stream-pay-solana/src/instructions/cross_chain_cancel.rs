use anchor_lang::prelude::*;
use solana_keccak_hasher::hash;

use crate::{
    constants::{
        CONSUMED_VAA_SEED, CROSS_CHAIN_CONFIG_SEED, CROSS_CHAIN_STREAM_SEED,
        ORGANIZATION_SEED, STREAM_SEED,
    },
    error::StreamPayError,
    state::{
        ConsumedVaa, CrossChainConfig, CrossChainStream, Organization, Stream,
    },
};

const VAA_HEADER_LEN: usize = 51;
const PAYLOAD_LEN: usize = 416;

const PAYLOAD_VERSION_OFFSET: usize = 31;
const PAYLOAD_ACTION_OFFSET: usize = 63;
const PAYLOAD_SOURCE_CHAIN_OFFSET: usize = 94;
const PAYLOAD_DESTINATION_CHAIN_OFFSET: usize = 126;
const PAYLOAD_OPERATION_ID_OFFSET: usize = 128;
const PAYLOAD_PROGRAM_OFFSET: usize = 160;
const PAYLOAD_ORGANIZATION_OFFSET: usize = 192;
const PAYLOAD_EMPLOYEE_OFFSET: usize = 224;
const PAYLOAD_STREAM_ID_OFFSET: usize = 256;
const PAYLOAD_START_TIME_OFFSET: usize = 320;
const PAYLOAD_END_TIME_OFFSET: usize = 352;

const ACTION_CANCEL: u8 = 2;

const SEPOLIA_WORMHOLE_CHAIN: u16 = 10002;
const SOLANA_WORMHOLE_CHAIN: u16 = 1;

#[derive(Accounts)]
#[instruction(sequence: u64)]
pub struct ExecuteCrossChainCancel<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [CROSS_CHAIN_CONFIG_SEED],
        bump = cross_chain_config.bump,
    )]
    pub cross_chain_config: Account<'info, CrossChainConfig>,

    #[account(
        seeds = [
            CONSUMED_VAA_SEED,
            cross_chain_config.source_emitter.as_ref(),
            &sequence.to_le_bytes(),
        ],
        bump = consumed_vaa.bump,
    )]
    pub consumed_vaa: Account<'info, ConsumedVaa>,

    #[account(
        seeds = [
            CROSS_CHAIN_STREAM_SEED,
            consumed_vaa.stream_id.as_ref(),
        ],
        bump = cross_chain_stream.bump,
    )]
    pub cross_chain_stream: Account<'info, CrossChainStream>,

    #[account(
        seeds = [
            ORGANIZATION_SEED,
            organization.authority.as_ref(),
        ],
        bump = organization.bump,
        constraint = cross_chain_stream.organization == organization.key()
            @ StreamPayError::Unauthorized,
    )]
    pub organization: Account<'info, Organization>,

    pub employee: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            STREAM_SEED,
            organization.key().as_ref(),
            employee.key().as_ref(),
            &cross_chain_stream.native_stream_id.to_le_bytes(),
        ],
        bump = stream.bump,
        constraint = stream.organization == organization.key()
            @ StreamPayError::Unauthorized,
        constraint = stream.employee == employee.key()
            @ StreamPayError::Unauthorized,
    )]
    pub stream: Account<'info, Stream>,
}

pub fn handle_execute_cross_chain_cancel(
    ctx: Context<ExecuteCrossChainCancel>,
    sequence: u64,
    vaa_body: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.consumed_vaa.sequence == sequence,
        StreamPayError::InvalidVaaSequence
    );

    require!(
        ctx.accounts.consumed_vaa.action == ACTION_CANCEL,
        StreamPayError::InvalidVaaAction
    );

    require!(
        vaa_body.len() >= VAA_HEADER_LEN,
        StreamPayError::InvalidVaaBody
    );

    let payload = &vaa_body[VAA_HEADER_LEN..];

    require!(
        payload.len() == PAYLOAD_LEN,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        hash(payload).to_bytes() == ctx.accounts.consumed_vaa.payload_hash,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        payload[PAYLOAD_VERSION_OFFSET] == 1,
        StreamPayError::InvalidVaaVersion
    );

    require!(
        payload[PAYLOAD_ACTION_OFFSET] == ACTION_CANCEL,
        StreamPayError::InvalidVaaAction
    );

    let source_chain = u16::from_be_bytes([
        payload[PAYLOAD_SOURCE_CHAIN_OFFSET],
        payload[PAYLOAD_SOURCE_CHAIN_OFFSET + 1],
    ]);

    let destination_chain = u16::from_be_bytes([
        payload[PAYLOAD_DESTINATION_CHAIN_OFFSET],
        payload[PAYLOAD_DESTINATION_CHAIN_OFFSET + 1],
    ]);

    require!(
        source_chain == SEPOLIA_WORMHOLE_CHAIN,
        StreamPayError::InvalidVaaSourceChain
    );

    require!(
        destination_chain == SOLANA_WORMHOLE_CHAIN,
        StreamPayError::InvalidVaaDestination
    );

    let mut operation_id = [0u8; 32];
    operation_id.copy_from_slice(
        &payload[PAYLOAD_OPERATION_ID_OFFSET..PAYLOAD_OPERATION_ID_OFFSET + 32],
    );

    require!(
        operation_id == ctx.accounts.consumed_vaa.operation_id,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        operation_id != [0u8; 32],
        StreamPayError::InvalidVaaPayload
    );

    let mut destination_program = [0u8; 32];
    destination_program.copy_from_slice(
        &payload[PAYLOAD_PROGRAM_OFFSET..PAYLOAD_PROGRAM_OFFSET + 32],
    );

    require!(
        destination_program == crate::ID.to_bytes(),
        StreamPayError::InvalidVaaDestination
    );

    let mut organization = [0u8; 32];
    organization.copy_from_slice(
        &payload[PAYLOAD_ORGANIZATION_OFFSET..PAYLOAD_ORGANIZATION_OFFSET + 32],
    );

    require!(
        organization == ctx.accounts.organization.key().to_bytes(),
        StreamPayError::Unauthorized
    );

    let mut employee = [0u8; 32];
    employee.copy_from_slice(
        &payload[PAYLOAD_EMPLOYEE_OFFSET..PAYLOAD_EMPLOYEE_OFFSET + 32],
    );

    require!(
        employee == ctx.accounts.employee.key().to_bytes(),
        StreamPayError::Unauthorized
    );

    let mut stream_id = [0u8; 32];
    stream_id.copy_from_slice(
        &payload[PAYLOAD_STREAM_ID_OFFSET..PAYLOAD_STREAM_ID_OFFSET + 32],
    );

    require!(
        stream_id == ctx.accounts.consumed_vaa.stream_id,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        stream_id == ctx.accounts.cross_chain_stream.external_stream_id,
        StreamPayError::InvalidVaaPayload
    );

    let start_time = decode_u64_word(
        &payload[PAYLOAD_START_TIME_OFFSET..PAYLOAD_START_TIME_OFFSET + 32],
    )?;

    let end_time = decode_u64_word(
        &payload[PAYLOAD_END_TIME_OFFSET..PAYLOAD_END_TIME_OFFSET + 32],
    )?;

    require!(
        start_time == ctx.accounts.stream.start_time as u64,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        end_time == ctx.accounts.stream.end_time as u64,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        !ctx.accounts.stream.canceled,
        StreamPayError::AlreadyCanceled
    );

    ctx.accounts.stream.canceled = true;
    ctx.accounts.stream.cancel_time = Clock::get()?.unix_timestamp;

    ctx.accounts.consumed_vaa.operation_id = [0u8; 32];

    msg!("Cross-chain stream cancellation completed");
    msg!("Sequence: {}", sequence);
    msg!("Operation ID: {:?}", operation_id);
    msg!("Stream ID: {:?}", stream_id);

    Ok(())
}

fn decode_u64_word(word: &[u8]) -> Result<u64> {
    require!(
        word.len() == 32,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        word[..24].iter().all(|byte| *byte == 0),
        StreamPayError::InvalidVaaPayload
    );

    let mut value = [0u8; 8];
    value.copy_from_slice(&word[24..32]);

    Ok(u64::from_be_bytes(value))
}