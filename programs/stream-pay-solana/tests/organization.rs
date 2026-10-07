use anchor_lang::{AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{constants::ORGANIZATION_SEED, instruction, Organization, ID};

#[test]
fn create_organization_creates_pda() {
    let mut svm = LiteSVM::new();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load Tokenva program");

    let authority = Keypair::new();

    svm.airdrop(&authority.pubkey(), 10_000_000_000)
        .expect("failed to fund authority");

    let (organization_anchor, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_SEED, authority.pubkey().as_ref()],
        &ID,
    );

    let organization = Address::new_from_array(organization_anchor.to_bytes());

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(organization, false),
            AccountMeta::new_readonly(solana_system_interface::program::ID, false),
        ],
        data: instruction::CreateOrganization {}.data(),
    };

    let transaction = Transaction::new(
        &[&authority],
        Message::new(&[instruction], Some(&authority.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(transaction)
        .expect("create organization transaction failed");

    let account = svm
        .get_account(&organization)
        .expect("Organization PDA was not created");

    let mut data: &[u8] = &account.data;

    let organization_data =
        Organization::try_deserialize(&mut data).expect("failed to deserialize Organization");

    assert_eq!(
        organization_data.authority.to_bytes(),
        authority.pubkey().to_bytes()
    );

    assert_eq!(organization_data.bump, bump);
    assert!(organization_data.created_at >= 0);

    println!("M3 organization test passed");
    println!("Organization: {}", organization);
    println!("Authority: {}", authority.pubkey());
    println!("Bump: {}", organization_data.bump);
    println!("Created at: {}", organization_data.created_at);
}

#[test]
fn unauthorized_wallet_cannot_use_existing_organization() {
    let mut svm = LiteSVM::new();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load Tokenva program");

    let company_a = Keypair::new();
    let company_b = Keypair::new();

    svm.airdrop(&company_a.pubkey(), 10_000_000_000)
        .expect("failed to fund company A");

    svm.airdrop(&company_b.pubkey(), 10_000_000_000)
        .expect("failed to fund company B");

    let (organization_anchor, bump) = anchor_lang::prelude::Pubkey::find_program_address(
        &[ORGANIZATION_SEED, company_a.pubkey().as_ref()],
        &ID,
    );

    let organization = Address::new_from_array(organization_anchor.to_bytes());

    let create_organization_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company_a.pubkey(), true),
            AccountMeta::new(organization, false),
            AccountMeta::new_readonly(solana_system_interface::program::ID, false),
        ],
        data: instruction::CreateOrganization {}.data(),
    };

    let create_tx = Transaction::new(
        &[&company_a],
        Message::new(&[create_organization_ix], Some(&company_a.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_tx)
        .expect("company A organization creation failed");

    let account = svm
        .get_account(&organization)
        .expect("organization was not created");

    let mut data: &[u8] = &account.data;

    let organization_data =
        Organization::try_deserialize(&mut data).expect("failed to deserialize Organization");

    assert_eq!(
        organization_data.authority.to_bytes(),
        company_a.pubkey().to_bytes()
    );

    assert_eq!(organization_data.bump, bump);

    // Company B attempts to use Company A's organization.
    let unauthorized_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(company_b.pubkey(), true),
            AccountMeta::new_readonly(organization, false),
            AccountMeta::new_readonly(solana_system_interface::program::ID, false),
        ],
        data: instruction::CreateOrganization {}.data(),
    };

    let unauthorized_tx = Transaction::new(
        &[&company_b],
        Message::new(&[unauthorized_ix], Some(&company_b.pubkey())),
        svm.latest_blockhash(),
    );

    assert!(svm.send_transaction(unauthorized_tx).is_err());

    println!("Unauthorized organization access correctly rejected");
}
