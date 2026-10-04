use anchor_lang::InstructionData;
use litesvm::LiteSVM;
use litesvm_token::{CreateAccount, CreateMint, MintTo, TOKEN_ID};
use solana_address::Address;
use solana_clock::Clock;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{
    constants::{
        ORGANIZATION_SEED, STREAM_ESCROW_SEED, STREAM_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED,
    },
    instruction, ID,
};

struct TestContext {
    svm: LiteSVM,
    program_id: Address,
    company: Keypair,
    employee: Keypair,
    wrong_employee: Keypair,
    token_program: Address,
    system_program: Address,
    mint: Address,
    employee_token_account: Address,
    wrong_employee_token_account: Address,
    organization: Address,
    vault: Address,
    vault_authority: Address,
    stream_id: u64,
    stream: Address,
    stream_escrow: Address,
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

    let employee_token_account = CreateAccount::new(&mut svm, &employee, &mint)
        .owner(&employee.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create employee token account");

    let wrong_employee_token_account = CreateAccount::new(&mut svm, &wrong_employee, &mint)
        .owner(&wrong_employee.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create wrong employee token account");

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
    .expect("failed to mint company tokens");

    let (organization_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_SEED, company.pubkey().as_ref()],
        &ID,
    );

    let organization = Address::new_from_array(organization_anchor.to_bytes());

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

    let (roles_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(
            &[b"organization_roles", organization.as_ref()],
            &ID,
        );
    let roles = Address::new_from_array(roles_anchor.to_bytes());

    let company_anchor =
        anchor_lang::prelude::Pubkey::new_from_array(company.pubkey().to_bytes());

    let initialize_roles_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new(roles, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeOrganizationRoles {
            admin: company_anchor,
            finance: company_anchor,
            approver: company_anchor,
            viewer: company_anchor,
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
            AccountMeta::new_readonly(roles, false),
        ],
        data: instruction::Deposit {
            amount: 1_250_000_000,
        }
        .data(),
    };

    let setup_tx = Transaction::new(
        &[&company],
        Message::new(
            &[create_organization_ix, initialize_roles_ix, initialize_vault_ix, deposit_ix],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("organization/vault/deposit setup failed");

    let stream_id = 1u64;

    let (stream_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[
            STREAM_SEED,
            organization.as_ref(),
            employee.pubkey().as_ref(),
            &stream_id.to_le_bytes(),
        ],
        &ID,
    );

    let stream = Address::new_from_array(stream_anchor.to_bytes());

    let (escrow_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[STREAM_ESCROW_SEED, stream.as_ref()],
        &ID,
    );

    let stream_escrow = Address::new_from_array(escrow_anchor.to_bytes());

    TestContext {
        svm,
        program_id,
        company,
        employee,
        wrong_employee,
        token_program,
        system_program,
        mint,
        employee_token_account,
        wrong_employee_token_account,
        organization,
        vault,
        vault_authority,
        stream_id,
        stream,
        stream_escrow,
    }
}

fn organization_roles(ctx: &TestContext) -> Address {
    let (roles_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(
            &[b"organization_roles", ctx.organization.as_ref()],
            &ID,
        );
    Address::new_from_array(roles_anchor.to_bytes())
}

fn create_stream(ctx: &mut TestContext, amount: u64, start_time: i64, end_time: i64) {
    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: amount,
            start_time,
            end_time,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    ctx.svm.send_transaction(tx).expect("create stream failed");
}

#[test]
fn create_stream_rejects_zero_amount() {
    let mut ctx = setup();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: 0,
            start_time: 1_000,
            end_time: 2_000,
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
        "zero stream amount should fail"
    );
}

#[test]
fn create_stream_rejects_invalid_time_range() {
    let mut ctx = setup();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: 1_000_000_000,
            start_time: 2_000,
            end_time: 1_000,
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
        "invalid time range should fail"
    );
}

#[test]
fn wrong_employee_cannot_claim() {
    let mut ctx = setup();

    create_stream(&mut ctx, 1_000_000_000, 1_000, 2_000);

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.wrong_employee.pubkey(), true),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.wrong_employee_token_account, false),
            AccountMeta::new_readonly(ctx.token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let tx = Transaction::new(
        &[&ctx.wrong_employee],
        Message::new(&[ix], Some(&ctx.wrong_employee.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong employee claim should fail"
    );
}

#[test]
fn top_up_after_stream_started_fails() {
    let mut ctx = setup();

    create_stream(&mut ctx, 1_000_000_000, 1_000, 2_000);

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::TopUpStream {
            stream_id: ctx.stream_id,
            amount: 1,
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
        "top-up after stream start should fail"
    );
}

fn cancel_stream(ctx: &mut TestContext) {
    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.employee_token_account, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CancelStream {
            stream_id: ctx.stream_id,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(&[ix], Some(&ctx.company.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    ctx.svm.send_transaction(tx).expect("cancel stream failed");
}

#[test]
fn cancel_stream_cannot_be_called_twice() {
    let mut ctx = setup();

    create_stream(&mut ctx, 1_000_000_000, 1_000, 2_000);

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    cancel_stream(&mut ctx);

    // Make the second transaction use a different recent blockhash.
    ctx.svm.expire_blockhash();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.employee_token_account, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CancelStream {
            stream_id: ctx.stream_id,
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
        "second cancellation should fail"
    );
}

#[test]
fn claim_after_cancel_fails() {
    let mut ctx = setup();

    create_stream(&mut ctx, 1_000_000_000, 1_000, 2_000);

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    cancel_stream(&mut ctx);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.employee.pubkey(), true),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.employee_token_account, false),
            AccountMeta::new_readonly(ctx.token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let tx = Transaction::new(
        &[&ctx.employee],
        Message::new(&[ix], Some(&ctx.employee.pubkey())),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "claim after cancellation should fail"
    );
}

#[test]
fn wrong_organization_is_rejected() {
    let mut ctx = setup();

    let other_company = Keypair::new();

    ctx.svm
        .airdrop(&other_company.pubkey(), 1_000_000_000)
        .expect("failed to fund other company");

    let (other_org_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(
            &[
                ORGANIZATION_SEED,
                other_company.pubkey().as_ref(),
            ],
            &ID,
        );

    let other_organization =
        Address::new_from_array(other_org_anchor.to_bytes());

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(other_organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: 1_000_000_000,
            start_time: 1_000,
            end_time: 2_000,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(
            &[ix],
            Some(&ctx.company.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong organization should fail"
    );
}

#[test]
fn wrong_vault_is_rejected() {
    let mut ctx = setup();

    let wrong_vault = Address::new_unique();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(wrong_vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: 1_000_000_000,
            start_time: 1_000,
            end_time: 2_000,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(
            &[ix],
            Some(&ctx.company.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong vault should fail"
    );
}

#[test]
fn wrong_mint_claim_is_rejected() {
    let mut ctx = setup();

    create_stream(
        &mut ctx,
        1_000_000_000,
        1_000,
        2_000,
    );

    let wrong_mint = CreateMint::new(&mut ctx.svm, &ctx.company)
        .authority(&ctx.company.pubkey())
        .decimals(6)
        .token_program_id(&ctx.token_program)
        .send()
        .expect("failed to create wrong mint");

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.employee.pubkey(), true),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(wrong_mint, false),
            AccountMeta::new(ctx.employee_token_account, false),
            AccountMeta::new_readonly(ctx.token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let tx = Transaction::new(
        &[&ctx.employee],
        Message::new(
            &[ix],
            Some(&ctx.employee.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong mint claim should fail"
    );
}

#[test]
fn wrong_token_program_is_rejected() {
    let mut ctx = setup();

    create_stream(
        &mut ctx,
        1_000_000_000,
        1_000,
        2_000,
    );

    let mut clock = ctx.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = 1_500;
    ctx.svm.set_sysvar::<Clock>(&clock);

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.employee.pubkey(), true),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.employee_token_account, false),

            // Deliberately pass System Program instead of Token Program.
            AccountMeta::new_readonly(ctx.system_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let tx = Transaction::new(
        &[&ctx.employee],
        Message::new(
            &[ix],
            Some(&ctx.employee.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "wrong token program should fail"
    );
}

#[test]
fn create_stream_requires_authority_signer() {
    let mut ctx = setup();

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            // Deliberately NOT a signer.
            AccountMeta::new(ctx.company.pubkey(), false),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.system_program, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::CreateStream {
            stream_id: ctx.stream_id,
            total_amount: 1_000_000_000,
            start_time: 1_000,
            end_time: 2_000,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.employee],
        Message::new(
            &[ix],
            Some(&ctx.employee.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "create_stream must require the company authority to sign"
    );
}

#[test]
fn top_up_zero_amount_is_rejected() {
    let mut ctx = setup();

    create_stream(
        &mut ctx,
        1_000_000_000,
        1_000,
        2_000,
    );

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::TopUpStream {
            stream_id: ctx.stream_id,
            amount: 0,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(
            &[ix],
            Some(&ctx.company.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "zero top-up should fail"
    );
}

#[test]
fn top_up_arithmetic_overflow_is_rejected() {
    let mut ctx = setup();

    create_stream(
        &mut ctx,
        1_000_000_000,
        1_000,
        2_000,
    );

    let ix = Instruction {
        program_id: ctx.program_id,
        accounts: vec![
            AccountMeta::new(ctx.company.pubkey(), true),
            AccountMeta::new_readonly(ctx.organization, false),
            AccountMeta::new_readonly(ctx.employee.pubkey(), false),
            AccountMeta::new(ctx.stream, false),
            AccountMeta::new(ctx.vault, false),
            AccountMeta::new_readonly(ctx.vault_authority, false),
            AccountMeta::new(ctx.stream_escrow, false),
            AccountMeta::new_readonly(ctx.mint, false),
            AccountMeta::new_readonly(ctx.token_program, false),
            AccountMeta::new_readonly(organization_roles(&ctx), false),
        ],
        data: instruction::TopUpStream {
            stream_id: ctx.stream_id,
            amount: u64::MAX,
        }
        .data(),
    };

    let tx = Transaction::new(
        &[&ctx.company],
        Message::new(
            &[ix],
            Some(&ctx.company.pubkey()),
        ),
        ctx.svm.latest_blockhash(),
    );

    assert!(
        ctx.svm.send_transaction(tx).is_err(),
        "overflowing top-up should fail"
    );
}

