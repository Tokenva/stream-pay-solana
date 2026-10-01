use anchor_lang::{AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{
    constants::{PROTOCOL_CONFIG_SEED, PROTOCOL_VERSION},
    instruction, ProtocolConfig, ID,
};

#[test]
fn initialize_protocol_creates_config_pda() {
    let mut svm = LiteSVM::new();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load StreamPay program");

    let payer = Keypair::new();

    svm.airdrop(&payer.pubkey(), 10_000_000_000)
        .expect("failed to fund payer");

    let (protocol_config_anchor, bump) =
        anchor_lang::prelude::Pubkey::find_program_address(&[PROTOCOL_CONFIG_SEED], &ID);

    let protocol_config = Address::new_from_array(protocol_config_anchor.to_bytes());

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(protocol_config, false),
            AccountMeta::new_readonly(solana_system_interface::program::ID, false),
        ],
        data: instruction::InitializeProtocol {}.data(),
    };

    let message = Message::new(&[instruction], Some(&payer.pubkey()));

    let transaction = Transaction::new(&[&payer], message, svm.latest_blockhash());

    svm.send_transaction(transaction)
        .expect("initialize_protocol transaction failed");

    let account = svm
        .get_account(&protocol_config)
        .expect("ProtocolConfig PDA was not created");

    let mut account_data: &[u8] = &account.data;

    let config = ProtocolConfig::try_deserialize(&mut account_data)
        .expect("failed to deserialize ProtocolConfig");

    assert_eq!(config.authority.to_bytes(), payer.pubkey().to_bytes());

    assert_eq!(config.version, PROTOCOL_VERSION);
    assert!(!config.paused);
    assert_eq!(config.bump, bump);
    assert!(config.created_at >= 0);

    println!("M1 ProtocolConfig test passed");
    println!("PDA: {}", protocol_config);
    println!("Authority: {}", payer.pubkey());
    println!("Version: {}", config.version);
    println!("Paused: {}", config.paused);
    println!("Bump: {}", config.bump);
    println!("Created at: {}", config.created_at);
}
