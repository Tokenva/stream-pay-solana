# StreamPay Solana

StreamPay Solana is an Anchor-based Solana smart contract project for initializing and managing a protocol-level configuration account. The current implementation provides the foundation for a protocol configuration PDA and a single initializer instruction.

## Overview

This project is built with Anchor and defines a minimal protocol configuration state that stores:

- authority: the wallet authorized to manage protocol configuration
- version: protocol version
- paused: runtime paused flag
- bump: PDA bump seed
- created_at: initialization timestamp

## Current functionality

The program currently exposes:

- `initialize_protocol`: creates the protocol config PDA and stores the protocol metadata on-chain

The protocol configuration is stored under a deterministic PDA derived from the seed `protocol` and the program ID.

## Project structure

```text
.
├── Anchor.toml
├── Cargo.toml
├── rust-toolchain.toml
├── readme.md
├── app/
├── programs/
│   └── stream-pay-solana/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── constants.rs
│       │   ├── error.rs
│       │   ├── instructions.rs
│       │   ├── lib.rs
│       │   ├── state.rs
│       │   └── instructions/
│       └── tests/
│           └── protocol_config.rs
└── target/
```

## Program details

- Program ID: `4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS`
- Anchor version: `1.2.0`
- Solana toolchain version: `4.1.2`
- Network default: `localnet`

## Local development

### Prerequisites

- Rust
- Solana CLI
- Anchor CLI

### Install dependencies

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v1.2.0 anchor-cli --locked
```

### Build the program

```bash
anchor build
```

### Run tests

```bash
anchor test
```

or

```bash
cargo test
```

### Deploy locally

```bash
anchor localnet
anchor deploy
```

## Notes

This repository is a structured starting point for a Solana payment/streaming protocol. The code currently focuses on the protocol configuration bootstrap and is ready to be extended with additional streaming, escrow, and payout instructions.

## License

This project is provided as-is for development and demonstration purposes.
