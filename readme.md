# StreamPay Solana

StreamPay Solana is an Anchor-based Solana smart contract for programmable payroll and token streaming. The protocol supports organization-managed funding, vault custody, per-stream payout schedules, employee claims, and cancellation logic for payroll-style recurring compensation.

## Overview

The program models a streamlined payment system in which:

- an organization creates a protocol-level configuration and a treasury vault,
- a company deposits SPL tokens into the vault,
- a stream is created for an employee with a total amount, start time, and end time,
- tokens are released over time based on earned value,
- employees can claim vested amounts from escrow,
- the company can top up or cancel an active stream.

## Core functionality

The current smart contract exposes the following instructions:

- `initialize_protocol`: initializes the global program configuration PDA
- `create_organization`: creates an organization account tied to an authority
- `initialize_vault`: creates the organization vault token account and vault authority PDA
- `deposit`: transfers funds from the organization wallet into the vault
- `create_stream`: creates a streaming payment for an employee and escrow account
- `top_up_stream`: adds additional funds to an existing stream escrow
- `claim`: allows the employee to claim earned tokens from their stream
- `cancel_stream`: settles or cancels an active stream and returns remaining unearned funds to the organization

## Account model

The protocol uses the following on-chain account types:

- `ProtocolConfig`: global configuration for the program
- `Organization`: per-organization metadata and authority
- `Stream`: payout schedule and stream state

### Stream state includes

- organization and employee public keys
- vault and escrow token accounts
- mint address
- stream ID
- total amount
- start and end time
- claimed amount
- canceled flag and cancel time
- bump seed

The `Stream::earned_amount()` logic calculates proportional payout based on elapsed time and the stream window.

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
│       │       ├── cancel_stream.rs
│       │       ├── claim.rs
│       │       ├── create_organization.rs
│       │       ├── create_stream.rs
│       │       ├── deposit.rs
│       │       ├── initialize_protocol.rs
│       │       ├── initialize_vault.rs
│       │       └── top_up_stream.rs
│       └── tests/
│           ├── claim.rs
│           ├── organization.rs
│           ├── protocol_config.rs
│           ├── security.rs
│           ├── stream.rs
│           └── vault.rs
└── target/
```

## Program details

- Program ID: `4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS`
- Anchor version: `1.2.0`
- Solana toolchain version: `4.1.2`
- Default network: `localnet`

## Local development

### Prerequisites

- Rust
- Solana CLI
- Anchor CLI

### Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v1.2.0 anchor-cli --locked
```

### Build the program

```bash
anchor build
```

### Run the test suite

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

This repository is not just a protocol bootstrap; it contains a working payroll-streaming flow with an organization model, token vaults, stream lifecycle management, and claim/cancel settlement logic. It is designed as a foundation for a real-world payroll or vesting system on Solana and can be extended with additional governance, compliance, or multi-asset support.

## License

This project is provided as-is for development and demonstration purposes.
