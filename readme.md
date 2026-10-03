# StreamPay

StreamPay is a programmable payroll and token-streaming project. Its Solana program supports organization-managed funding, vault custody, per-stream payout schedules, employee claims, and cancellation. The repository also includes an EVM gateway built with Hardhat and Wormhole-related interfaces.

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

## Repository components

- `programs/stream-pay-solana/`: Anchor program and Rust tests for Solana payroll streams.
- `evm-gateway/`: Solidity gateway contract, Hardhat configuration, scripts, and tests.
- `backend/`: TypeScript backend services.
- `web/`: Next.js web application.

## Project structure

```text
.
├── Anchor.toml
├── Cargo.toml
├── rust-toolchain.toml
├── readme.md
├── app/
├── backend/
│   └── src/
├── evm-gateway/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── idls/
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
├── target/
└── web/
	└── src/
```

## Program details

- Program ID: `4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS`
- Anchor version: `1.2.0`
- Solana toolchain version: `4.1.2`
- Default network: `localnet`

## Solana development

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

## EVM gateway development

The gateway uses Hardhat and Solidity `0.8.28`. Install its dependencies and run the contract checks from the gateway directory:

```bash
cd evm-gateway
npm install
npx hardhat compile
npx hardhat test
```

For Sepolia operations, create a local `.env` file with `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY`. The configuration falls back to a public Sepolia RPC endpoint and uses no signing account when these variables are unset.

## Backend development

The backend requires Node.js and a PostgreSQL database. Set `DATABASE_URL` in `backend/.env`; optionally set `SOLANA_RPC_URL` to use a different Solana cluster (the default is Devnet) and `PORT` to change the server port (the default is `4000`). Start the service from the backend directory:

```bash
cd backend
npm install
npm run dev
```

The API health endpoint is available at `http://localhost:4000/health` by default. The database tables are initialized when the service starts.

## Web development

The Next.js app uses `http://localhost:4000` for its backend API by default. Set `NEXT_PUBLIC_API_URL` and, if needed, `NEXT_PUBLIC_BACKEND_URL` in `web/.env.local` to point to another backend. Start the app from the web directory:

```bash
cd web
npm install
npm run dev
```

The app is served at `http://localhost:3000` by default. Use `npm run lint` to run ESLint or `npm run build` to create a production build.

## Notes

The Solana program provides the payroll-streaming flow, including organization management, token vaults, stream lifecycle management, and claim/cancel settlement logic. The EVM gateway is maintained as a separate Hardhat project under `evm-gateway/`.

## License

This project is provided as-is for development and demonstration purposes.
