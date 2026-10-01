use anchor_lang::InstructionData;
use litesvm::LiteSVM;
use litesvm_token::{
    get_spl_account, spl_token::state::Account as SplTokenAccount, CreateAccount, CreateMint,
    MintTo,
};
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{
    constants::{PROTOCOL_CONFIG_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED},
    instruction, ID,
};

#[test]
fn initialize_vault_and_deposit() {
    let mut svm = LiteSVM::new().with_default_programs();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load StreamPay program");

    let payer = Keypair::new();

    svm.airdrop(&payer.pubkey(), 10_000_000_000)
        .expect("failed to fund payer");

    // Create a test token mint with 6 decimals.
    let mint = CreateMint::new(&mut svm, &payer)
        .authority(&payer.pubkey())
        .decimals(6)
        .send()
        .expect("failed to create mint");

    // Create the company's token account.
    let company_token_account = CreateAccount::new(&mut svm, &payer, &mint)
        .owner(&payer.pubkey())
        .send()
        .expect("failed to create company token account");

    // Give the company 3,000 tokens.
    MintTo::new(
        &mut svm,
        &payer,
        &mint,
        &company_token_account,
        3_000_000_000,
    )
    .owner(&payer)
    .send()
    .expect("failed to mint test tokens");

    let token_program = Address::new_from_array(anchor_spl::token::ID.to_bytes());

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    let (protocol_config, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[PROTOCOL_CONFIG_SEED], &ID);

    let protocol_config = Address::new_from_array(protocol_config.to_bytes());

    let (vault, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[VAULT_SEED, mint.as_ref()], &ID);

    let vault = Address::new_from_array(vault.to_bytes());

    let (vault_authority, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_AUTHORITY_SEED, mint.as_ref()],
        &ID,
    );

    let vault_authority = Address::new_from_array(vault_authority.to_bytes());

    // Step 1: initialize protocol.
    let initialize_protocol_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(protocol_config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeProtocol {}.data(),
    };

    // Step 2: create vault.
    let initialize_vault_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(protocol_config, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(vault_authority, false),
            AccountMeta::new_readonly(token_program, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeVault {}.data(),
    };

    let setup_tx = Transaction::new(
        &[&payer],
        Message::new(
            &[initialize_protocol_ix, initialize_vault_ix],
            Some(&payer.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("protocol/vault setup failed");

    // Step 3: deposit 1,000 tokens into the vault.
    let deposit_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
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

    let deposit_tx = Transaction::new(
        &[&payer],
        Message::new(&[deposit_ix], Some(&payer.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(deposit_tx).expect("deposit failed");

    // Verify company balance = 2,000 tokens.
    let company_account: SplTokenAccount =
        get_spl_account(&svm, &company_token_account).expect("company token account missing");

    assert_eq!(company_account.amount, 2_000_000_000);

    // Verify vault balance = 1,000 tokens.
    let vault_account: SplTokenAccount =
        get_spl_account(&svm, &vault).expect("vault token account missing");

    assert_eq!(vault_account.amount, 1_000_000_000);

    println!("M2 deposit test passed");
    println!("Company balance: {}", company_account.amount);
    println!("Vault balance: {}", vault_account.amount);

    // A zero-value deposit must be rejected.
    let zero_deposit_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(company_token_account, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new(vault, false),
            AccountMeta::new_readonly(token_program, false),
        ],
        data: instruction::Deposit { amount: 0 }.data(),
    };

    let zero_deposit_tx = Transaction::new(
        &[&payer],
        Message::new(&[zero_deposit_ix], Some(&payer.pubkey())),
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(zero_deposit_tx);

    assert!(result.is_err());

    println!("Zero deposit correctly rejected");
}
