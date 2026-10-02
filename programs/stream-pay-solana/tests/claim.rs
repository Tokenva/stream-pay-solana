use anchor_lang::{AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use litesvm_token::{
    get_spl_account, spl_token::state::Account as SplTokenAccount, CreateAccount, CreateMint,
    MintTo, TOKEN_ID,
};
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

#[test]
fn employee_can_claim_earned_tokens() {
    let mut svm = LiteSVM::new().with_default_programs().with_sysvars();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load StreamPay program");

    let company = Keypair::new();
    let employee = Keypair::new();

    svm.airdrop(&company.pubkey(), 10_000_000_000)
        .expect("failed to fund company");

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

    // Company's token account.
    let company_token_account = CreateAccount::new(&mut svm, &company, &mint)
        .owner(&company.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create company token account");

    // Employee's token account.
    let employee_token_account = CreateAccount::new(&mut svm, &employee, &mint)
        .owner(&employee.pubkey())
        .token_program_id(&token_program)
        .send()
        .expect("failed to create employee token account");

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

    // Deposit 1,000 tokens into the company vault.
    let deposit_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new(company_token_account, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(token_program, false),
        ],
        data: instruction::Deposit {
            amount: 1_000_000_000,
        }
        .data(),
    };

    let setup_tx = Transaction::new(
        &[&company],
        Message::new(
            &[create_organization_ix, initialize_vault_ix, deposit_ix],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("organization/vault/deposit setup failed");

    // Stream configuration.
    let stream_id = 1u64;
    let total_amount = 1_000_000_000u64;
    let start_time = 1_000i64;
    let end_time = 2_000i64;

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

    // Stream escrow PDA.
    let (escrow_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[STREAM_ESCROW_SEED, stream.as_ref()],
        &ID,
    );

    let stream_escrow = Address::new_from_array(escrow_anchor.to_bytes());

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
        ],
        data: instruction::CreateStream {
            stream_id,
            total_amount,
            start_time,
            end_time,
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

    // At the exact start time, nothing should be claimable.
    let mut clock = svm.get_sysvar::<Clock>();
    clock.unix_timestamp = start_time;
    svm.set_sysvar::<Clock>(&clock);

    let early_claim_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(employee.pubkey(), true),
            AccountMeta::new(stream, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(employee_token_account, false),
            AccountMeta::new_readonly(token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let early_claim_tx = Transaction::new(
        &[&employee],
        Message::new(&[early_claim_ix], Some(&employee.pubkey())),
        svm.latest_blockhash(),
    );

    assert!(
        svm.send_transaction(early_claim_tx).is_err(),
        "claim before stream starts should fail"
    );

    // Move to halfway through the stream.
    clock.unix_timestamp = 1_500;
    svm.set_sysvar::<Clock>(&clock);

    // The early-claim transaction used the previous blockhash.
    // Expire it so the successful claim gets a new transaction signature.
    svm.expire_blockhash();

    // Employee claims.
    let claim_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(employee.pubkey(), true),
            AccountMeta::new(stream, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(employee_token_account, false),
            AccountMeta::new_readonly(token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let claim_tx = Transaction::new(
        &[&employee],
        Message::new(&[claim_ix], Some(&employee.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(claim_tx).expect("claim failed");

    // Employee should receive 500 tokens.
    let employee_account: SplTokenAccount =
        get_spl_account(&svm, &employee_token_account).expect("employee token account missing");

    assert_eq!(employee_account.amount, 500_000_000);

    // Escrow should retain the remaining 500 tokens.
    let escrow_account: SplTokenAccount =
        get_spl_account(&svm, &stream_escrow).expect("stream escrow missing");

    assert_eq!(escrow_account.amount, 500_000_000);

    // Stream should record the claimed amount.
    let stream_account = svm.get_account(&stream).expect("stream account missing");

    let stream_data = stream_pay_solana::Stream::try_deserialize(&mut &stream_account.data[..])
        .expect("failed to deserialize Stream account");

    assert_eq!(stream_data.claimed_amount, 500_000_000);
    assert_eq!(stream_data.bump, stream_bump);

    println!("M4.4 claim test passed");
    println!("Employee balance: {}", employee_account.amount);
    println!("Escrow balance: {}", escrow_account.amount);
    println!("Claimed amount: {}", stream_data.claimed_amount);

    // A second claim at the same timestamp should fail.
    let second_claim_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(employee.pubkey(), true),
            AccountMeta::new(stream, false),
            AccountMeta::new(stream_escrow, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(employee_token_account, false),
            AccountMeta::new_readonly(token_program, false),
        ],
        data: instruction::Claim {}.data(),
    };

    let second_claim_tx = Transaction::new(
        &[&employee],
        Message::new(&[second_claim_ix], Some(&employee.pubkey())),
        svm.latest_blockhash(),
    );

    assert!(
        svm.send_transaction(second_claim_tx).is_err(),
        "second claim should fail when nothing new is earned"
    );

    println!("M4.5 claim safety tests passed");
}
