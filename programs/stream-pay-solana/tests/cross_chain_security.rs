use anchor_lang::{AccountSerialize, InstructionData, Space};
use litesvm::LiteSVM;
use litesvm_token::{CreateAccount, CreateMint, MintTo, TOKEN_ID};
use solana_account::Account as SolanaAccount;
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{
    constants::{
        CONSUMED_VAA_SEED, CROSS_CHAIN_ASSET_CONFIG_SEED, CROSS_CHAIN_CONFIG_SEED,
        CROSS_CHAIN_STREAM_SEED, ORGANIZATION_ROLES_SEED, ORGANIZATION_SEED, PROTOCOL_CONFIG_SEED,
        STREAM_ESCROW_SEED, STREAM_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED,
        WORMHOLE_SEPOLIA_CHAIN_ID,
    },
    instruction,
    state::ConsumedVaa,
    ID,
};

fn shim_program_id() -> Address {
    "EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at"
        .parse()
        .expect("invalid shim program id")
}

const PAYLOAD_LEN: usize = 416;
const VAA_HEADER_LEN: usize = 51;

const VERSION_OFFSET: usize = 31;
const ACTION_OFFSET: usize = 63;
const SOURCE_CHAIN_OFFSET: usize = 94;
const DESTINATION_CHAIN_OFFSET: usize = 126;
const OPERATION_ID_OFFSET: usize = 128;
const PROGRAM_OFFSET: usize = 160;
const ORGANIZATION_OFFSET: usize = 192;
const EMPLOYEE_OFFSET: usize = 224;
const STREAM_ID_OFFSET: usize = 256;
const AMOUNT_OFFSET: usize = 288;
const START_TIME_OFFSET: usize = 320;
const END_TIME_OFFSET: usize = 352;
const MESSAGE_NONCE_OFFSET: usize = 384;

const ACTION_CREATE: u8 = 0;
const SEPOLIA_CHAIN: u16 = 10002;
const SOLANA_CHAIN: u16 = 1;

const SOURCE_EMITTER: [u8; 32] = [0x11; 32];

struct TestContext {
    svm: LiteSVM,
    program_id: Address,
    company: Keypair,
    employee: Keypair,
    wrong_employee: Keypair,
    token_program: Address,
    system_program: Address,
    mint: Address,
    organization: Address,
    vault: Address,
    vault_authority: Address,
    cross_chain_config: Address,
    cross_chain_asset_config: Address,
    sequence: u64,
    native_stream_id: u64,
}

fn setup() -> TestContext {
    let mut svm = LiteSVM::new().with_default_programs().with_sysvars();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load StreamPay program");

    let company = Keypair::new();
    let employee = Keypair::new();
    let wrong_employee = Keypair::new();

    svm.airdrop(&company.pubkey(), 10_000_000_000)
        .expect("failed to fund company");

    svm.airdrop(&employee.pubkey(), 1_000_000_000)
        .expect("failed to fund employee");

    svm.airdrop(&wrong_employee.pubkey(), 1_000_000_000)
        .expect("failed to fund wrong employee");

    let token_program = TOKEN_ID;

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    let mint = CreateMint::new(&mut svm, &company)
        .authority(&company.pubkey())
        .decimals(6)
        .token_program_id(&token_program)
        .send()
        .expect("failed to create mint");

    let company_token_account = CreateAccount::new(&mut svm, &company, &mint)
        .owner(&company.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create company token account");

    MintTo::new(
        &mut svm,
        &company,
        &mint,
        &company_token_account,
        1_250_000_000,
    )
    .token_program_id(&token_program)
    .owner(&company)
    .send()
    .expect("failed to mint tokens");

    let (protocol_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[PROTOCOL_CONFIG_SEED], &ID);

    let protocol_config = Address::new_from_array(protocol_anchor.to_bytes());

    let (organization_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_SEED, company.pubkey().as_ref()],
        &ID,
    );

    let organization = Address::new_from_array(organization_anchor.to_bytes());

    let (organization_roles_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_ROLES_SEED, organization.as_ref()],
        &ID,
    );

    let organization_roles = Address::new_from_array(organization_roles_anchor.to_bytes());

    let (vault_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_SEED, organization.as_ref(), mint.as_ref()],
        &ID,
    );

    let vault = Address::new_from_array(vault_anchor.to_bytes());

    let (vault_authority_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_AUTHORITY_SEED, organization.as_ref(), mint.as_ref()],
        &ID,
    );

    let vault_authority = Address::new_from_array(vault_authority_anchor.to_bytes());

    let (cross_chain_config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[CROSS_CHAIN_CONFIG_SEED], &ID);

    let cross_chain_config = Address::new_from_array(cross_chain_config_anchor.to_bytes());

    let (asset_config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[CROSS_CHAIN_ASSET_CONFIG_SEED], &ID);

    let cross_chain_asset_config = Address::new_from_array(asset_config_anchor.to_bytes());

    let initialize_protocol_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new(protocol_config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeProtocol {}.data(),
    };

    let create_organization_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new(organization, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::CreateOrganization {}.data(),
    };

    let initialize_vault_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(vault_authority, false),
            AccountMeta::new_readonly(token_program, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeVault {}.data(),
    };

    let initialize_organization_roles_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new(organization_roles, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeOrganizationRoles {
            admin: company.pubkey(),
            finance: company.pubkey(),
            approver: company.pubkey(),
            viewer: company.pubkey(),
        }
        .data(),
    };

    let (policy_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[b"organization_policy", organization.as_ref()],
        &ID,
    );
    let policy = Address::new_from_array(policy_anchor.to_bytes());

    let mint_anchor = anchor_lang::prelude::Pubkey::new_from_array(mint.to_bytes());

    let initialize_policy_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new(policy, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeOrganizationPolicy {
            approved_mint: mint_anchor,
            max_transaction_amount: 10_000_000_000,
            max_payroll_amount: 10_000_000_000,
            max_employee_amount: 10_000_000_000,
            require_approval: false,
            paused: false,
        }
        .data(),
    };

    let deposit_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new(company_token_account, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(token_program, false),
            AccountMeta::new_readonly(organization_roles, false),
            AccountMeta::new_readonly(policy, false),
        ],
        data: instruction::Deposit {
            amount: 1_250_000_000,
        }
        .data(),
    };

    let setup_tx = Transaction::new(
        &[&company],
        Message::new(
            &[
                initialize_protocol_ix,
                create_organization_ix,
                initialize_vault_ix,
                initialize_organization_roles_ix,
                initialize_policy_ix,
                deposit_ix,
            ],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("base protocol setup failed");

    let initialize_cross_chain_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(protocol_config, false),
            AccountMeta::new(cross_chain_config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeCrossChainConfig {
            source_emitter: SOURCE_EMITTER,
        }
        .data(),
    };

    let initialize_asset_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(protocol_config, false),
            AccountMeta::new(cross_chain_asset_config, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeCrossChainAssetConfig {}.data(),
    };

    let cross_chain_tx = Transaction::new(
        &[&company],
        Message::new(
            &[initialize_cross_chain_ix, initialize_asset_ix],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(cross_chain_tx)
        .expect("cross-chain configuration setup failed");

    svm.add_program(
        shim_program_id(),
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to install shim test program");

    TestContext {
        svm,
        program_id,
        company,
        employee,
        wrong_employee,
        token_program,
        system_program,
        mint,
        organization,
        vault,
        vault_authority,
        cross_chain_config,
        cross_chain_asset_config,
        sequence: 7,
        native_stream_id: 8,
    }
}

fn write_u64_word(payload: &mut [u8], offset: usize, value: u64) {
    payload[offset + 24..offset + 32].copy_from_slice(&value.to_be_bytes());
}

fn write_u16_word(payload: &mut [u8], offset: usize, value: u16) {
    payload[offset..offset + 2].copy_from_slice(&value.to_be_bytes());
}

fn base_payload(ctx: &TestContext) -> Vec<u8> {
    let mut payload = vec![0u8; PAYLOAD_LEN];

    payload[VERSION_OFFSET] = 1;
    payload[ACTION_OFFSET] = ACTION_CREATE;

    write_u16_word(&mut payload, SOURCE_CHAIN_OFFSET, SEPOLIA_CHAIN);

    write_u16_word(&mut payload, DESTINATION_CHAIN_OFFSET, SOLANA_CHAIN);

    payload[OPERATION_ID_OFFSET..OPERATION_ID_OFFSET + 32].copy_from_slice(&[0x22; 32]);

    payload[PROGRAM_OFFSET..PROGRAM_OFFSET + 32].copy_from_slice(&ctx.program_id.to_bytes());

    payload[ORGANIZATION_OFFSET..ORGANIZATION_OFFSET + 32]
        .copy_from_slice(&ctx.organization.to_bytes());

    payload[EMPLOYEE_OFFSET..EMPLOYEE_OFFSET + 32]
        .copy_from_slice(&ctx.employee.pubkey().to_bytes());

    payload[STREAM_ID_OFFSET..STREAM_ID_OFFSET + 32].copy_from_slice(&[0x33; 32]);

    write_u64_word(&mut payload, AMOUNT_OFFSET, 100_000_000);

    write_u64_word(&mut payload, START_TIME_OFFSET, 1_000);

    write_u64_word(&mut payload, END_TIME_OFFSET, 2_000);

    write_u64_word(&mut payload, MESSAGE_NONCE_OFFSET, 8);

    payload
}

fn build_vaa_body(payload: &[u8], sequence: u64, emitter_chain: u16, emitter: [u8; 32]) -> Vec<u8> {
    let mut body = vec![0u8; VAA_HEADER_LEN];

    body[8..10].copy_from_slice(&emitter_chain.to_be_bytes());

    body[10..42].copy_from_slice(&emitter);

    body[42..50].copy_from_slice(&sequence.to_be_bytes());

    body.extend_from_slice(payload);

    body
}

fn consumed_pda(sequence: u64) -> Address {
    let (pda, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[CONSUMED_VAA_SEED, &SOURCE_EMITTER, &sequence.to_le_bytes()],
        &ID,
    );

    Address::new_from_array(pda.to_bytes())
}

fn install_consumed_vaa(
    ctx: &mut TestContext,
    payload: &[u8],
    pda_sequence: u64,
    stored_sequence: u64,
    operation_id: [u8; 32],
    stream_id: [u8; 32],
    amount: u64,
    start_time: u64,
    end_time: u64,
    action: u8,
) {
    let consumed = ConsumedVaa {
        emitter_chain: WORMHOLE_SEPOLIA_CHAIN_ID,
        emitter_address: SOURCE_EMITTER,
        sequence: stored_sequence,
        action,
        operation_id,
        stream_id,
        amount,
        start_time,
        end_time,
        payload_hash: solana_keccak_hasher::hash(payload).to_bytes(),
        consumed_at: 1,
        bump: anchor_lang::prelude::Pubkey::find_program_address(
            &[
                CONSUMED_VAA_SEED,
                &SOURCE_EMITTER,
                &pda_sequence.to_le_bytes(),
            ],
            &ID,
        )
        .1,
    };

    let mut data = Vec::with_capacity(8 + ConsumedVaa::INIT_SPACE);

    consumed
        .try_serialize(&mut data)
        .expect("failed to serialize ConsumedVaa");

    let address = consumed_pda(pda_sequence);

    let lamports = ctx.svm.minimum_balance_for_rent_exemption(data.len());

    ctx.svm
        .set_account(
            address,
            SolanaAccount {
                lamports,
                data,
                owner: ctx.program_id,
                executable: false,
                rent_epoch: 0,
            },
        )
        .expect("failed to install ConsumedVaa");
}

fn execute_create(
    ctx: &mut TestContext,
    payload: Vec<u8>,
    sequence: u64,
    native_stream_id: u64,
) -> Result<(), String> {
    let external_stream_id: [u8; 32] = payload[STREAM_ID_OFFSET..STREAM_ID_OFFSET + 32]
        .try_into()
        .map_err(|_| "invalid stream id".to_string())?;

    let (cross_chain_stream_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[CROSS_CHAIN_STREAM_SEED, &external_stream_id],
        &ID,
    );

    let cross_chain_stream = Address::new_from_array(cross_chain_stream_anchor.to_bytes());

    let (stream_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[
            STREAM_SEED,
            ctx.organization.as_ref(),
            ctx.employee.pubkey().as_ref(),
            &native_stream_id.to_le_bytes(),
        ],
        &ID,
    );

    let stream = Address::new_from_array(stream_anchor.to_bytes());

    let (escrow_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[STREAM_ESCROW_SEED, stream.as_ref()],
        &ID,
    );

    let stream_escrow = Address::new_from_array(escrow_anchor.to_bytes());

    let vaa_body = build_vaa_body(&payload, sequence, SEPOLIA_CHAIN, SOURCE_EMITTER);

    let instruction_data = instruction::ExecuteCrossChainAction {
        sequence,
        native_stream_id,
        vaa_body,
    }
    .data();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.cross_chain_config, false),
            AccountMeta::new_readonly(consumed_pda(sequence), false),
            AccountMeta::new_readonly(ctx.cross_chain_asset_config, false),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(cross_chain_stream, false),
            AccountMeta::new(stream, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
        ],
        data: instruction_data,
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    ctx.svm
        .send_transaction(tx)
        .map(|_| ())
        .map_err(|err| format!("{err:?}"))
}

#[test]
fn initialize_cross_chain_config_rejects_zero_emitter() {
    let mut ctx = setup();

    let (config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[CROSS_CHAIN_CONFIG_SEED], &ID);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(
                Address::new_from_array(
                    anchor_lang::prelude::Pubkey::find_program_address(
                        &[PROTOCOL_CONFIG_SEED],
                        &ID,
                    )
                    .0
                    .to_bytes(),
                ),
                false,
            ),
            AccountMeta::new(Address::new_from_array(config_anchor.to_bytes()), false),
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::InitializeCrossChainConfig {
            source_emitter: [0u8; 32],
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "zero source emitter must fail"
    );
}

#[test]
fn consume_vaa_rejects_short_body() {
    let mut ctx = setup();

    let sequence = 100u64;

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.cross_chain_config, false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(shim_program_id(), false),
            AccountMeta::new(consumed_pda(sequence), false),
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::ConsumeVaa {
            guardian_set_bump: 255,
            sequence,
            vaa_body: vec![0u8; 50],
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "short VAA body must fail"
    );
}

#[test]
fn consume_vaa_rejects_sequence_mismatch() {
    let mut ctx = setup();

    let sequence = 100u64;

    let mut body = vec![0u8; VAA_HEADER_LEN];

    body[8..10].copy_from_slice(&SEPOLIA_CHAIN.to_be_bytes());

    body[10..42].copy_from_slice(&SOURCE_EMITTER);

    body[42..50].copy_from_slice(&999u64.to_be_bytes());

    body.extend_from_slice(&vec![0u8; PAYLOAD_LEN]);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.cross_chain_config, false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(shim_program_id(), false),
            AccountMeta::new(consumed_pda(sequence), false),
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::ConsumeVaa {
            guardian_set_bump: 255,
            sequence,
            vaa_body: body,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "VAA sequence mismatch must fail"
    );
}

#[test]
fn consume_vaa_rejects_wrong_source_chain() {
    let mut ctx = setup();

    let sequence = 101u64;

    let mut body = vec![0u8; VAA_HEADER_LEN];

    body[8..10].copy_from_slice(&9999u16.to_be_bytes());

    body[10..42].copy_from_slice(&SOURCE_EMITTER);

    body[42..50].copy_from_slice(&sequence.to_be_bytes());

    body.extend_from_slice(&vec![0u8; PAYLOAD_LEN]);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.cross_chain_config, false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(shim_program_id(), false),
            AccountMeta::new(consumed_pda(sequence), false),
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::ConsumeVaa {
            guardian_set_bump: 255,
            sequence,
            vaa_body: body,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong source chain must fail"
    );
}

#[test]
fn consume_vaa_rejects_wrong_emitter() {
    let mut ctx = setup();

    let sequence = 102u64;

    let mut body = vec![0u8; VAA_HEADER_LEN];

    body[8..10].copy_from_slice(&SEPOLIA_CHAIN.to_be_bytes());

    body[10..42].copy_from_slice(&[0x77; 32]);

    body[42..50].copy_from_slice(&sequence.to_be_bytes());

    body.extend_from_slice(&vec![0u8; PAYLOAD_LEN]);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.cross_chain_config, false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(Address::new_unique(), false),
            AccountMeta::new_readonly(shim_program_id(), false),
            AccountMeta::new(consumed_pda(sequence), false),
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::ConsumeVaa {
            guardian_set_bump: 255,
            sequence,
            vaa_body: body,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong emitter must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_payload_hash_mismatch() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let payload = base_payload(&ctx);

    let operation_id = [0x22; 32];

    let stream_id = [0x33; 32];

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        operation_id,
        stream_id,
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    let mut tampered = payload.clone();

    tampered[AMOUNT_OFFSET + 31] ^= 1;

    assert!(
        execute_create(&mut ctx, tampered, sequence, native_stream_id,).is_err(),
        "payload hash mismatch must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_invalid_version() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    payload[VERSION_OFFSET] = 9;

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "invalid VAA version must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_invalid_action() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    payload[ACTION_OFFSET] = 1;

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "wrong action must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_wrong_destination_chain() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    write_u16_word(&mut payload, DESTINATION_CHAIN_OFFSET, 9999);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "wrong destination chain must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_wrong_destination_program() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    payload[PROGRAM_OFFSET..PROGRAM_OFFSET + 32].copy_from_slice(&[0x44; 32]);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "wrong destination program must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_operation_id_mismatch() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let payload = base_payload(&ctx);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x99; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "operation mismatch must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_stream_id_mismatch() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let payload = base_payload(&ctx);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x99; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "stream id mismatch must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_wrong_employee() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    payload[EMPLOYEE_OFFSET..EMPLOYEE_OFFSET + 32]
        .copy_from_slice(&ctx.wrong_employee.pubkey().to_bytes());

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "wrong employee must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_malformed_u64_word() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    payload[AMOUNT_OFFSET] = 1;

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "non-canonical u64 word must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_invalid_time_range() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    write_u64_word(&mut payload, START_TIME_OFFSET, 2_000);

    write_u64_word(&mut payload, END_TIME_OFFSET, 1_000);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        2_000,
        1_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "invalid time range must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_zero_amount() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    write_u64_word(&mut payload, AMOUNT_OFFSET, 0);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        0,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "zero amount must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_zero_message_nonce() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let mut payload = base_payload(&ctx);

    write_u64_word(&mut payload, MESSAGE_NONCE_OFFSET, 0);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "zero message nonce must fail"
    );
}

#[test]
fn execute_cross_chain_action_rejects_sequence_mismatch() {
    let mut ctx = setup();
    let native_stream_id = ctx.native_stream_id;

    let payload = base_payload(&ctx);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        9,
        7,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    assert!(
        execute_create(&mut ctx, payload, 9, native_stream_id,).is_err(),
        "stored sequence mismatch must fail"
    );
}

#[test]
fn execute_cross_chain_action_replay_is_rejected() {
    let mut ctx = setup();
    let sequence = ctx.sequence;
    let native_stream_id = ctx.native_stream_id;

    let payload = base_payload(&ctx);

    install_consumed_vaa(
        &mut ctx,
        &payload,
        sequence,
        sequence,
        [0x22; 32],
        [0x33; 32],
        100_000_000,
        1_000,
        2_000,
        ACTION_CREATE,
    );

    execute_create(&mut ctx, payload.clone(), sequence, native_stream_id)
        .expect("first cross-chain execution should succeed");

    ctx.svm.expire_blockhash();

    assert!(
        execute_create(&mut ctx, payload, sequence, native_stream_id,).is_err(),
        "replay must be rejected"
    );
}
