use anchor_lang::{AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use litesvm_token::{CreateMint, TOKEN_ID};
use solana_address::Address;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

use stream_pay_solana::{
    constants::{CROSS_CHAIN_ASSET_CONFIG_SEED, PROTOCOL_CONFIG_SEED},
    instruction, CrossChainAssetConfig, ID,
};

#[test]
fn initialize_cross_chain_asset_config() {
    let mut svm = LiteSVM::new().with_default_programs();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load Tokenva program");

    let authority = Keypair::new();

    svm.airdrop(&authority.pubkey(), 10_000_000_000)
        .expect("failed to fund authority");

    let mint = CreateMint::new(&mut svm, &authority)
        .authority(&authority.pubkey())
        .decimals(6)
        .token_program_id(&TOKEN_ID)
        .send()
        .expect("failed to create mint");

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    let (protocol_config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[PROTOCOL_CONFIG_SEED], &ID);

    let protocol_config = Address::new_from_array(protocol_config_anchor.to_bytes());

    let (asset_config_anchor, bump) =
        anchor_lang::prelude::Pubkey::find_program_address(&[CROSS_CHAIN_ASSET_CONFIG_SEED], &ID);

    let asset_config = Address::new_from_array(asset_config_anchor.to_bytes());

    let initialize_protocol_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(protocol_config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeProtocol {}.data(),
    };

    let initialize_asset_config_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new_readonly(protocol_config, false),
            AccountMeta::new(asset_config, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeCrossChainAssetConfig {}.data(),
    };

    let transaction = Transaction::new(
        &[&authority],
        Message::new(
            &[initialize_protocol_ix, initialize_asset_config_ix],
            Some(&authority.pubkey()),
        ),
        svm.latest_blockhash(),
    );

    svm.send_transaction(transaction)
        .expect("cross-chain asset config initialization failed");

    let account = svm
        .get_account(&asset_config)
        .expect("CrossChainAssetConfig PDA was not created");

    let mut account_data: &[u8] = &account.data;

    let config = CrossChainAssetConfig::try_deserialize(&mut account_data)
        .expect("failed to deserialize CrossChainAssetConfig");

    assert_eq!(config.authority.to_bytes(), authority.pubkey().to_bytes());

    assert_eq!(config.mint.to_bytes(), mint.to_bytes());

    assert_eq!(config.bump, bump);
    assert!(config.created_at >= 0);

    println!("M11.1 cross-chain asset config test passed");
    println!("Asset Config: {}", asset_config);
    println!("Authority: {}", authority.pubkey());
    println!("Mint: {}", mint);
    println!("Bump: {}", config.bump);
}

#[test]
fn unauthorized_authority_cannot_initialize_cross_chain_asset_config() {
    let mut svm = LiteSVM::new().with_default_programs();

    let program_id = Address::new_from_array(ID.to_bytes());

    svm.add_program(
        program_id,
        include_bytes!("../../../target/deploy/stream_pay_solana.so"),
    )
    .expect("failed to load Tokenva program");

    let authority = Keypair::new();
    let attacker = Keypair::new();

    svm.airdrop(&authority.pubkey(), 10_000_000_000)
        .expect("failed to fund authority");

    svm.airdrop(&attacker.pubkey(), 10_000_000_000)
        .expect("failed to fund attacker");

    let attacker_mint = CreateMint::new(&mut svm, &attacker)
        .authority(&attacker.pubkey())
        .decimals(6)
        .token_program_id(&TOKEN_ID)
        .send()
        .expect("failed to create attacker mint");

    let system_program = Address::new_from_array(solana_system_interface::program::ID.to_bytes());

    let (protocol_config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[PROTOCOL_CONFIG_SEED], &ID);

    let protocol_config = Address::new_from_array(protocol_config_anchor.to_bytes());

    let (asset_config_anchor, _) =
        anchor_lang::prelude::Pubkey::find_program_address(&[CROSS_CHAIN_ASSET_CONFIG_SEED], &ID);

    let asset_config = Address::new_from_array(asset_config_anchor.to_bytes());

    let initialize_protocol_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(protocol_config, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeProtocol {}.data(),
    };

    let initialize_protocol_tx = Transaction::new(
        &[&authority],
        Message::new(&[initialize_protocol_ix], Some(&authority.pubkey())),
        svm.latest_blockhash(),
    );

    svm.send_transaction(initialize_protocol_tx)
        .expect("protocol initialization failed");

    let unauthorized_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(attacker.pubkey(), true),
            AccountMeta::new_readonly(protocol_config, false),
            AccountMeta::new(asset_config, false),
            AccountMeta::new_readonly(attacker_mint, false),
            AccountMeta::new_readonly(system_program, false),
        ],
        data: instruction::InitializeCrossChainAssetConfig {}.data(),
    };

    let unauthorized_tx = Transaction::new(
        &[&attacker],
        Message::new(&[unauthorized_ix], Some(&attacker.pubkey())),
        svm.latest_blockhash(),
    );

    assert!(
        svm.send_transaction(unauthorized_tx).is_err(),
        "unauthorized authority should not initialize cross-chain asset config"
    );

    assert!(
        svm.get_account(&asset_config).is_none(),
        "asset config must not be created by unauthorized authority"
    );

    println!("M11.5 unauthorized asset config test passed");
}
