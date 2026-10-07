use anchor_lang::InstructionData;
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
    constants::{ORGANIZATION_ROLES_SEED, ORGANIZATION_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED},
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
    .expect("failed to load Tokenva program");

    let company = Keypair::new();

    svm.airdrop(&company.pubkey(), 10_000_000_000)
        .expect("failed to fund company");

    // Use the same token program as litesvm-token.
    let token_program = TOKEN_ID;

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    // Create a test USDC-like mint.
    let mint = CreateMint::new(&mut svm, &company)
        .authority(&company.pubkey())
        .decimals(6)
        .token_program_id(&token_program)
        .send()
        .expect("failed to create mint");

    // Create the company's token account.
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

    // Organization roles PDA.
    let (organization_roles_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_ROLES_SEED, organization.as_ref()],
        &ID,
    );

    let organization_roles = Address::new_from_array(organization_roles_anchor.to_bytes());

    // Company-specific vault PDA.
    let (vault_anchor, _) = anchor_lang::prelude::Pubkey::find_program_address(
        &[VAULT_SEED, organization.as_ref(), mint.as_ref()],
        &ID,
    );

    let vault = Address::new_from_array(vault_anchor.to_bytes());

    // Company-specific vault authority PDA.
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

    // Create company-specific Vault.
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

    // Initialize organization roles.
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

    let setup_tx = Transaction::new(
        &[&company],
        Message::new(
            &[
                create_organization_ix,
                initialize_vault_ix,
                initialize_organization_roles_ix,
                initialize_policy_ix,
            ],
            Some(&company.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(setup_tx)
        .expect("organization/vault setup failed");

    // Deposit 1,000 tokens.
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
            amount: 1_000_000_000,
        }
        .data(),
    };

    let deposit_tx = Transaction::new(
        &[&company],
        Message::new(&[deposit_ix], Some(&company.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(deposit_tx).expect("deposit failed");

    // Verify company balance.
    let company_account: SplTokenAccount =
        get_spl_account(&svm, &company_token_account).expect("company token account missing");

    assert_eq!(company_account.amount, 2_000_000_000);

    // Verify vault balance.
    let vault_account: SplTokenAccount =
        get_spl_account(&svm, &vault).expect("vault token account missing");

    assert_eq!(vault_account.amount, 1_000_000_000);

    // Verify vault uses the expected mint.
    assert_eq!(vault_account.mint, mint);

    // Verify vault is controlled by the expected PDA.
    assert_eq!(vault_account.owner, vault_authority);

    println!("M3 company vault test passed");
    println!("Organization: {}", organization);
    println!("Mint: {}", mint);
    println!("Vault: {}", vault);
    println!("Vault authority: {}", vault_authority);
    println!("Company balance: {}", company_account.amount);
    println!("Vault balance: {}", vault_account.amount);
}
