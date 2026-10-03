use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};
use solana_keccak_hasher::hash;

use crate::{
    constants::{
        CONSUMED_VAA_SEED, CROSS_CHAIN_ASSET_CONFIG_SEED, CROSS_CHAIN_CONFIG_SEED,
        CROSS_CHAIN_STREAM_SEED, ORGANIZATION_SEED, STREAM_ESCROW_SEED, STREAM_SEED,
        VAULT_AUTHORITY_SEED, VAULT_SEED,
    },
    error::StreamPayError,
    state::{
        ConsumedVaa, CrossChainAssetConfig, CrossChainConfig, CrossChainStream, Organization,
        Stream,
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
const PAYLOAD_AMOUNT_OFFSET: usize = 288;
const PAYLOAD_START_TIME_OFFSET: usize = 320;
const PAYLOAD_END_TIME_OFFSET: usize = 352;
const PAYLOAD_MESSAGE_NONCE_OFFSET: usize = 384;

const ACTION_CREATE: u8 = 0;

const SEPOLIA_WORMHOLE_CHAIN: u16 = 10002;
const SOLANA_WORMHOLE_CHAIN: u16 = 1;

#[derive(Accounts)]
#[instruction(sequence: u64, native_stream_id: u64)]

pub struct ExecuteCrossChainAction<'info> {
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
        seeds = [CROSS_CHAIN_ASSET_CONFIG_SEED],
        bump = cross_chain_asset_config.bump,
    )]
    pub cross_chain_asset_config: Account<'info, CrossChainAssetConfig>,

    #[account(
        seeds = [
            ORGANIZATION_SEED,
            organization.authority.as_ref(),
        ],
        bump = organization.bump,
    )]
    pub organization: Account<'info, Organization>,

    pub employee: SystemAccount<'info>,

    #[account(
        address = cross_chain_asset_config.mint
            @ StreamPayError::InvalidVaaPayload
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            organization.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        token::mint = mint,
        token::authority = vault_authority,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the organization vault.
    #[account(
        seeds = [
            VAULT_AUTHORITY_SEED,
            organization.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + CrossChainStream::INIT_SPACE,
        seeds = [
            CROSS_CHAIN_STREAM_SEED,
            consumed_vaa.stream_id.as_ref(),
        ],
        bump
    )]
    pub cross_chain_stream: Account<'info, CrossChainStream>,

    #[account(
    init,
    payer = payer,
    space = 8 + Stream::INIT_SPACE,
    seeds = [
        STREAM_SEED,
        organization.key().as_ref(),
        employee.key().as_ref(),
        &native_stream_id.to_le_bytes(),
    ],
    bump
)]
    pub stream: Account<'info, Stream>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = stream,
        seeds = [
            STREAM_ESCROW_SEED,
            stream.key().as_ref(),
        ],
        bump
    )]
    pub stream_escrow: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_execute_cross_chain_action(
    ctx: Context<ExecuteCrossChainAction>,
    sequence: u64,
    native_stream_id: u64,
    vaa_body: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.consumed_vaa.sequence == sequence,
        StreamPayError::InvalidVaaSequence
    );

    require!(
        ctx.accounts.consumed_vaa.action == ACTION_CREATE,
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

    let payload_hash = hash(payload).to_bytes();

    require!(
        payload_hash == ctx.accounts.consumed_vaa.payload_hash,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        payload[PAYLOAD_VERSION_OFFSET] == 1,
        StreamPayError::InvalidVaaVersion
    );

    require!(
        payload[PAYLOAD_ACTION_OFFSET] == ACTION_CREATE,
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

    require!(
        source_chain == ctx.accounts.cross_chain_config.source_chain,
        StreamPayError::InvalidVaaSourceChain
    );

    require!(
        ctx.accounts.consumed_vaa.emitter_chain == source_chain,
        StreamPayError::InvalidVaaSourceChain
    );

    require!(
        ctx.accounts.consumed_vaa.emitter_address == ctx.accounts.cross_chain_config.source_emitter,
        StreamPayError::InvalidVaaEmitter
    );

    let destination_program: [u8; 32] = payload
        [PAYLOAD_PROGRAM_OFFSET..PAYLOAD_PROGRAM_OFFSET + 32]
        .try_into()
        .unwrap();

    require!(
        destination_program == crate::ID.to_bytes(),
        StreamPayError::InvalidVaaDestination
    );

    let operation_id: [u8; 32] = payload
        [PAYLOAD_OPERATION_ID_OFFSET..PAYLOAD_OPERATION_ID_OFFSET + 32]
        .try_into()
        .unwrap();

    let external_stream_id: [u8; 32] = payload
        [PAYLOAD_STREAM_ID_OFFSET..PAYLOAD_STREAM_ID_OFFSET + 32]
        .try_into()
        .unwrap();

    require!(operation_id != [0u8; 32], StreamPayError::InvalidVaaPayload);

    require!(
        external_stream_id != [0u8; 32],
        StreamPayError::InvalidVaaPayload
    );

    require!(
        operation_id == ctx.accounts.consumed_vaa.operation_id,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        external_stream_id == ctx.accounts.consumed_vaa.stream_id,
        StreamPayError::InvalidVaaPayload
    );

    let organization_bytes: [u8; 32] = payload
        [PAYLOAD_ORGANIZATION_OFFSET..PAYLOAD_ORGANIZATION_OFFSET + 32]
        .try_into()
        .unwrap();

    let employee_bytes: [u8; 32] = payload[PAYLOAD_EMPLOYEE_OFFSET..PAYLOAD_EMPLOYEE_OFFSET + 32]
        .try_into()
        .unwrap();

    let organization_key = Pubkey::new_from_array(organization_bytes);

    let employee_key = Pubkey::new_from_array(employee_bytes);

    require!(
        organization_key == ctx.accounts.organization.key(),
        StreamPayError::InvalidVaaPayload
    );

    require!(
        employee_key == ctx.accounts.employee.key(),
        StreamPayError::InvalidVaaPayload
    );

    let amount = decode_u64_word(&payload[PAYLOAD_AMOUNT_OFFSET..PAYLOAD_AMOUNT_OFFSET + 32])?;

    let start_time_u64 =
        decode_u64_word(&payload[PAYLOAD_START_TIME_OFFSET..PAYLOAD_START_TIME_OFFSET + 32])?;

    let end_time_u64 =
        decode_u64_word(&payload[PAYLOAD_END_TIME_OFFSET..PAYLOAD_END_TIME_OFFSET + 32])?;

    let message_nonce =
        decode_u64_word(&payload[PAYLOAD_MESSAGE_NONCE_OFFSET..PAYLOAD_MESSAGE_NONCE_OFFSET + 32])?;

    require!(message_nonce > 0, StreamPayError::InvalidVaaPayload);
    require!(
        amount == ctx.accounts.consumed_vaa.amount,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        start_time_u64 == ctx.accounts.consumed_vaa.start_time,
        StreamPayError::InvalidVaaPayload
    );

    require!(
        end_time_u64 == ctx.accounts.consumed_vaa.end_time,
        StreamPayError::InvalidVaaPayload
    );
    require!(
        message_nonce == native_stream_id,
        StreamPayError::InvalidVaaPayload
    );

    require!(native_stream_id > 0, StreamPayError::InvalidVaaPayload);
    let start_time =
        i64::try_from(start_time_u64).map_err(|_| error!(StreamPayError::InvalidVaaPayload))?;

    let end_time =
        i64::try_from(end_time_u64).map_err(|_| error!(StreamPayError::InvalidVaaPayload))?;

    require!(amount > 0, StreamPayError::InvalidAmount);

    require!(end_time > start_time, StreamPayError::InvalidVaaPayload);

    let cross_chain_stream = &mut ctx.accounts.cross_chain_stream;

    cross_chain_stream.external_stream_id = external_stream_id;

    cross_chain_stream.native_stream_id = native_stream_id;

    cross_chain_stream.organization = organization_key;

    cross_chain_stream.employee = employee_key;

    cross_chain_stream.mint = ctx.accounts.mint.key();

    cross_chain_stream.operation_id = operation_id;

    cross_chain_stream.created_at = Clock::get()?.unix_timestamp;

    cross_chain_stream.bump = ctx.bumps.cross_chain_stream;

    let stream = &mut ctx.accounts.stream;

    stream.organization = ctx.accounts.organization.key();

    stream.employee = ctx.accounts.employee.key();

    stream.vault = ctx.accounts.vault.key();

    stream.escrow = ctx.accounts.stream_escrow.key();

    stream.mint = ctx.accounts.mint.key();

    stream.stream_id = native_stream_id;

    stream.total_amount = amount;

    stream.start_time = start_time;

    stream.end_time = end_time;

    stream.claimed_amount = 0;

    stream.canceled = false;

    stream.cancel_time = 0;

    stream.bump = ctx.bumps.stream;

    let organization_key = ctx.accounts.organization.key();

    let mint_key = ctx.accounts.mint.key();

    let vault_authority_bump = [ctx.bumps.vault_authority];

    let vault_authority_seeds: &[&[u8]] = &[
        VAULT_AUTHORITY_SEED,
        organization_key.as_ref(),
        mint_key.as_ref(),
        &vault_authority_bump,
    ];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.stream_escrow.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let signer_seeds = [vault_authority_seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        &signer_seeds,
    );

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    msg!("Cross-chain stream created");
    msg!("Sequence: {}", sequence);
    msg!("Operation ID: {:?}", operation_id);
    msg!("External stream ID: {:?}", external_stream_id);
    msg!("Native stream ID: {}", native_stream_id);
    msg!("Amount: {}", amount);

    Ok(())
}

fn decode_u64_word(word: &[u8]) -> Result<u64> {
    require!(word.len() == 32, StreamPayError::InvalidVaaPayload);

    require!(
        word[..24].iter().all(|byte| *byte == 0),
        StreamPayError::InvalidVaaPayload
    );

    let mut bytes = [0u8; 8];

    bytes.copy_from_slice(&word[24..32]);

    Ok(u64::from_be_bytes(bytes))
}
