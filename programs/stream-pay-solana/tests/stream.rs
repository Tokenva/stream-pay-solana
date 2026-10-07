use anchor_lang::{AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use litesvm_token::{
    get_spl_account, spl_token::state::Account as SplTokenAccount, CreateAccount, CreateMint,
    MintTo, TOKEN_ID,
};
use solana_address::Address;
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

#[test]
fn create_stream_creates_stream_pda() {
    let mut svm = LiteSVM::new().with_default_programs();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load Tokenva program");

    // Company wallet.
    let company = Keypair::new();

    svm.airdrop(&company.pubkey(), 10_000_000_000)
        .expect("failed to fund company");

    // Employee wallet.
    let employee = Keypair::new();

    svm.airdrop(&employee.pubkey(), 1_000_000_000)
        .expect("failed to fund employee");

    let token_program = TOKEN_ID;

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    // Create test USDC-like mint.
    let mint = CreateMint::new(&mut svm, &company)
        .authority(&company.pubkey())
        .decimals(6)
        .token_program_id(&token_program)
        .send()
        .expect("failed to create mint");

    // Create company's token account.
    let company_token_account = CreateAccount::new(&mut svm, &company, &mint)
        .owner(&company.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create company token account");

    // Give company 3,000 tokens.
    MintTo::new(
        &mut svm,
        &company,
        &mint,
        &company_token_account,
        3_000_000_000,
    )
    .token_program_id(&token_program)
    .owner(&company)
    .send()
    .expect("failed to mint company tokens");

    // Organization PDA.
    let (organization_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_SEED, company.pubkey().as_ref()],
        &ID,
    );

    let organization = Address::new_from_array(organization_anchor.to_bytes());

    // Vault PDA.
    let (vault_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_SEED, organization.as_ref(), mint.as_ref()],
        &ID,
    );

    let vault = Address::new_from_array(vault_anchor.to_bytes());

    // Vault authority PDA.
    let (vault_authority_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_AUTHORITY_SEED, organization.as_ref(), mint.as_ref()],
        &ID,
    );

    let vault_authority = Address::new_from_array(vault_authority_anchor.to_bytes());

    // Create Organization.
    let create_organization_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new(organization, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::CreateOrganization {}.data(),
    };

    // Initialize Vault.
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

    let (roles_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[b"organization_roles", organization.as_ref()],
        &ID,
    );
    let roles = Address::new_from_array(roles_anchor.to_bytes());

    let company_anchor = anchor_lang::prelude::Pubkey::new_from_array(company.pubkey().to_bytes());

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
            AccountMeta::new_readonly(roles, false),
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
                create_organization_ix,
                initialize_roles_ix,
                initialize_vault_ix,
                initialize_policy_ix,
                deposit_ix,
            ],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("organization/vault setup failed");

    // Stream ID.
    let stream_id = 1u64;
    let total_amount = 1_000_000_000u64;

    // Stream PDA.
    let (stream_anchor, stream_bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[
            STREAM_SEED,
            organization.as_ref(),
            employee.pubkey().as_ref(),
            &stream_id.to_le_bytes(),
        ],
        &ID,
    );

    let stream = Address::new_from_array(stream_anchor.to_bytes());
    let (stream_escrow_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[STREAM_ESCROW_SEED, stream.as_ref()],
        &ID,
    );

    let stream_escrow = Address::new_from_array(stream_escrow_anchor.to_bytes());
    // Create Stream.
    let create_stream_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new_readonly(employee.pubkey(), false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(vault_authority, false),
            AccountMeta::new(stream, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(system_program, false),
            AccountMeta::new_readonly(token_program, false),
            AccountMeta::new_readonly(roles, false),
            AccountMeta::new_readonly(policy, false),
        ],
        data: instruction::CreateStream {
            stream_id,
            total_amount,
            start_time: 1_000,
            end_time: 31_536_000,
        }
        .data(),
    };

    let create_stream_tx = Transaction::new(
        &[&company],
        Message::new(&[create_stream_ix], Some(&company.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_stream_tx)
        .expect("create stream failed");

    // Read the Stream account.
    let stream_account = svm.get_account(&stream).expect("stream account not found");

    assert!(!stream_account.data.is_empty());

    // Deserialize Anchor account data.
    let stream_data = stream_pay_solana::Stream::try_deserialize(&mut &stream_account.data[..])
        .expect("failed to deserialize Stream account");

    assert_eq!(stream_data.organization, organization.into());
    assert_eq!(stream_data.employee, employee.pubkey());
    assert_eq!(stream_data.vault, vault.into());
    assert_eq!(stream_data.mint, mint.into());
    assert_eq!(stream_data.stream_id, stream_id);
    assert_eq!(stream_data.total_amount, 1_000_000_000);
    assert_eq!(stream_data.start_time, 1_000);
    assert_eq!(stream_data.end_time, 31_536_000);
    assert_eq!(stream_data.claimed_amount, 0);
    assert_eq!(stream_data.bump, stream_bump);

    println!("M4.2 create stream test passed");
    println!("Organization: {}", organization);
    println!("Employee: {}", employee.pubkey());
    println!("Mint: {}", mint);
    println!("Vault: {}", vault);
    println!("Stream: {}", stream);
    println!("Stream ID: {}", stream_data.stream_id);
    println!("Total amount: {}", stream_data.total_amount);

    let top_up_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new_readonly(employee.pubkey(), false),
            AccountMeta::new(stream, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(vault_authority, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(token_program, false),
            AccountMeta::new_readonly(roles, false),
            AccountMeta::new_readonly(policy, false),
        ],
        data: instruction::TopUpStream {
            stream_id,
            amount: 250_000_000,
        }
        .data(),
    };

    let top_up_tx = Transaction::new(
        &[&company],
        Message::new(&[top_up_ix], Some(&company.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(top_up_tx).expect("top-up failed");

    let updated_stream_account = svm
        .get_account(&stream)
        .expect("updated stream account missing");

    let updated_stream_data =
        stream_pay_solana::Stream::try_deserialize(&mut &updated_stream_account.data[..])
            .expect("failed to deserialize updated Stream account");

    let updated_escrow_account: SplTokenAccount =
        get_spl_account(&svm, &stream_escrow).expect("stream escrow missing");

    let updated_vault_account: SplTokenAccount =
        get_spl_account(&svm, &vault).expect("vault missing");

    assert_eq!(updated_stream_data.total_amount, 1_250_000_000);

    assert_eq!(updated_escrow_account.amount, 1_250_000_000);

    assert_eq!(updated_vault_account.amount, 0);
}

#[test]
fn stream_calculates_earned_amount() {
    let stream = stream_pay_solana::Stream {
        organization: anchor_lang::prelude::Pubkey::default(),
        employee: anchor_lang::prelude::Pubkey::default(),
        vault: anchor_lang::prelude::Pubkey::default(),
        escrow: anchor_lang::prelude::Pubkey::default(),
        mint: anchor_lang::prelude::Pubkey::default(),
        stream_id: 1,
        total_amount: 1_000,
        canceled: false,
        cancel_time: 0,
        start_time: 100,
        end_time: 200,
        claimed_amount: 0,
        bump: 1,
    };

    assert_eq!(stream.earned_amount(99), 0);
    assert_eq!(stream.earned_amount(100), 0);
    assert_eq!(stream.earned_amount(150), 500);
    assert_eq!(stream.earned_amount(175), 750);
    assert_eq!(stream.earned_amount(200), 1_000);
    assert_eq!(stream.earned_amount(250), 1_000);

    println!("M4.3 stream earning calculation test passed");
}
