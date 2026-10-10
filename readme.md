# TokenvaPay

**Trustless Cross-Chain Asset Streaming & Payroll Protocol**

Tokenva is a Solana-first programmable payroll and payment-streaming prototype. It combines organization-managed treasury vaults, time-based payment streams, employee claims, stream lifecycle controls, an EVM gateway, Wormhole cross-chain messaging, and Wormhole Native Token Transfer (NTT).

> **Project status:** Technical milestones M0–M12 are complete. M12 is the final technical milestone; there is no M13. The next phase is product definition and customer discovery (P1).

## Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Development setup](#development-setup)
- [Deployment references](#deployment-references)
- [Demonstration evidence](#demonstration-evidence)
- [Testing and verification](#testing-and-verification)
- [Security and limitations](#security-and-limitations)
- [Roadmap status](#roadmap-status)
- [License](#license)

## Overview

Tokenva supports a native Solana payroll flow:

```text
Company wallet
     ↓
Organization
     ↓
Tokenva vault
     ↓
Create payment stream
     ↓
Stream escrow
     ↓
Time-based earning
     ↓
Employee claim
     ↓
Employee token account
```

A stream tracks its organization, employee, token mint, stream ID, total amount, start and end times, claimed amount, cancellation state, and related custody accounts. `Stream::earned_amount()` calculates the amount earned over the stream's configured time window.

The Solana program is the source of truth for on-chain state. The backend indexes and serves queryable data; it does not replace the program.

## Architecture

Tokenva separates cross-chain **control-plane actions** from **asset-plane transfers**.

### Control plane: cross-chain actions

```text
Ethereum Sepolia
     ↓
Tokenva EVM Gateway
     ↓
Wormhole message
     ↓
VAA
     ↓
Guardian verification
     ↓
Solana VAA verification shim
     ↓
Tokenva consume_vaa
     ↓
Cross-chain Tokenva action
```

The gateway supports cross-chain intents for `CreateStream`, `TopUpStream`, and `CancelStream`. The demonstrations recorded for this project exercised `CreateStream` and `TopUpStream`.

### Asset plane: Wormhole NTT

```text
EVM Sepolia ERC-20
     ↓
Wormhole NTT
     ↓
Solana Devnet SPL token
     ↓
Destination wallet
     ↓
Manual Tokenva vault deposit
     ↓
Stream escrow
     ↓
Employee claim
```

The M11 demonstration completed a real Sepolia-to-Solana NTT transfer. The received asset was then deposited into the Tokenva vault manually. The demonstrated workflow does **not** include an automated atomic NTT-receive-to-vault relayer transaction.

### Application and indexing

```text
On-chain transaction path
Connected wallet → Next.js web app → Solana Devnet RPC → Tokenva program
                         └─ signs transactions

Indexed read path
Solana program → RPC → stream/activity indexers → PostgreSQL → Express API
                                                               ↓
                                                        Next.js web app
```

## Features

- Organization and protocol configuration
- Token vault initialization and deposits
- Time-based payment streams and employee claims
- Stream top-ups and cancellation
- Indexed stream and activity queries through the backend
- EVM gateway for cross-chain Tokenva actions
- Wormhole VAA verification and cross-chain execution path
- Wormhole NTT asset transfer prototype
- Security-focused Solana tests and EVM gateway tests

Core native Solana instructions include `initialize_protocol`, `create_organization`, `initialize_vault`, `deposit`, `create_stream`, `top_up_stream`, `claim`, and `cancel_stream`.

The cross-chain execution path includes `consume_vaa`, `execute_cross_chain_create_stream`, and `execute_cross_chain_top_up`.

## Technology stack

| Area | Technologies |
|---|---|
| Solana program | Rust, Anchor |
| Solana tooling recorded for this project | Anchor CLI 1.2.0, Solana CLI 4.1.2, Rust 1.98.1 |
| Web application | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL |
| EVM gateway | Solidity 0.8.28, Hardhat |
| Cross-chain messaging and assets | Wormhole messaging, VAA verification, Wormhole NTT |
| Demonstration networks | Solana Devnet, Ethereum Sepolia |

## Repository layout

```text
.
├── Anchor.toml
├── Cargo.toml
├── Cargo.lock
├── rust-toolchain.toml
├── deployment.json
├── readme.md
├── doc.md
├── Tokenva_Product_Roadmap_M0-M12.md
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
│       └── tests/
└── web/
    └── src/
```

NTT deployment support is maintained separately in `/projects/stream-pay-ntt` for reproducibility. Do not commit `.env` files, private keys, or other secret key material.

## Development setup

### Prerequisites

Install Rust, Cargo, Solana CLI, Anchor CLI, and Node.js/npm versions compatible with the project packages.

Check the Anchor CLI version:

```bash
anchor --version
```

### Solana program

Run these commands from the repository root:

```bash
anchor build
cargo test
```

For the full Anchor test workflow, use:

```bash
anchor test
```

For local development, follow the project's configured localnet workflow. Use the documented Devnet deployment when reproducing the cross-chain demonstrations; localnet state is separate from Devnet state.

### EVM gateway

```bash
cd evm-gateway
npm install
npx hardhat compile
npx hardhat test
```

For Sepolia operations, create a local `evm-gateway/.env` containing the required configuration:

```dotenv
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
```

Use your own credentials and never commit this file or disclose private keys.

### Backend and web application

Use each package's existing scripts and lockfiles. From the relevant package directory, install dependencies with `npm ci` where a lockfile is available, then run the package's typecheck, lint, build, or test scripts as defined in its `package.json`.

Do not assume that local environment variables, database contents, or deployed service configuration match production.

## Deployment references

These are project references recorded for the prototype. Confirm network and deployment state before relying on them for a new deployment.

### Solana Devnet

| Item | Address / value |
|---|---|
| Tokenva program ID | `4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS` |
| RPC endpoint | `https://api.devnet.solana.com` |
| Vault used in the recorded demonstration | `2bUM6WJy5F7cfPs2eV3Umhp6cnYjU6L4rbwQ7tMnusCF` |
| Stream #14 | `9jFund1g7mtFfAAxC2uy4FUytMC9QUTqPRhoymASi2MG` |
| Stream #14 escrow | `928WAuWxyzktSLj7YiG5kbHKpRfDtogsNfTfySb2QJFe` |

### EVM gateway and Wormhole

| Item | Address |
|---|---|
| Canonical Sepolia Tokenva gateway recorded for this project | `0x13a5b0be7F5841Ac2Cb0D07e71bB4209f469F104` |
| Wormhole Core on Sepolia | `0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78` |
| Wormhole Core on Solana Devnet | `3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5` |
| Solana VAA verification shim | `EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at` |

### Wormhole NTT deployment

| Item | Recorded value |
|---|---|
| EVM NTT Manager | `0x794513173F19f845e0f65eaa25E1993d155F9617` |
| EVM Wormhole Transceiver | `0xeD456304d60850A9fE582E34a427005b98eC880f` |
| Tokenva M11 ERC-20 | `0x7E37db0F3b62a2b77E206509235da94CC195016D` |
| Solana NTT Manager | `ntt66yTmjfbc459s9m8zhE948bd79vYwvJayV3pXrr5` |
| Solana token | `6jDvPYSs5qerGyXe3G2FLpFJhFQHHvjbkj9Xi9jYDxhB` |
| Solana Wormhole Transceiver | `36tGDqAkiAuaRhLMkHhvR63hJvTojekuacPGRkFDshvq` |
| Token decimals | 6 |
| EVM mode | Locking |
| Solana mode | Burning |

## Demonstration evidence

### Native Solana claim

Recorded claim transaction:

`CEDLuqHsNURcNZZyKXd5ycmttgXGFaqCnZr8aNFHA4ppcxMqjeSjApeqbMifmFSMf11CTesoKEZgG9Q9112feDN`

Recorded token-balance reconciliation:

| Account | Before | After |
|---|---:|---:|
| Employee | 0 | 3.296296 |
| Escrow | 50 | 46.703704 |
| **Combined** | **50.000000** | **50.000000** |

### NTT transfer

The recorded NTT command was:

```bash
ntt token-transfer \
  --network Testnet \
  --source-chain Sepolia \
  --destination-chain Solana \
  --amount 1 \
  --destination-address 94K4HrLfv3Ra8o8iCxi5aP8cENt2HBSMkycnkWnwkz1g \
  --deployment-path ./deployment.json
```

Recorded source transactions:

- `0x6c98267887fcdc296ae7f6fd1da091e0dc22df9720dc3e004c7c5ccddaf41b92`
- `0xbfd21e50369c0b4c7a589cae38ada14bcff146072f06a92fcaa2d9a6ae9e2e50`

Recorded Wormhole sequence: `2`.

[View the recorded WormholeScan transaction](https://wormholescan.io/#/tx/0xbfd21e50369c0b4c7a589cae38ada14bcff146072f06a92fcaa2d9a6ae9e2e50?network=Testnet)

The destination wallet received the asset, after which `1 SPT` was manually deposited into the Tokenva vault.

## Testing and verification

The latest complete regression recorded in the project context was:

| Check | Recorded result |
|---|---|
| Solana / Rust tests | 41 passed, 0 failed |
| EVM Hardhat tests | 9 passed |
| Backend typecheck | Pass |
| Web lint | Pass |
| Web production build | Pass |
| EVM compile | Pass |
| `git diff --check` | Pass |
| Git working tree at final packaging | Clean |

These are recorded results, not a claim that tests have been rerun against the current checkout.

The recorded M12 commits are:

- `61d3755` — `chore: complete M12 technical packaging`
- `e9d491b` — `chore: ignore generated EVM types`

A non-blocking Rust warning was recorded for an unused `authority_mint` variable in `programs/stream-pay-solana/tests/cross_chain_asset.rs`.

## Security and limitations

Tokenva is a technical prototype, not a production payroll service. Its test coverage and validation logic are not substitutes for an independent security audit.

The cross-chain execution path validates VAA structure, sequence, trusted source chain and emitter, guardian verification, payload fields, destination, operation and stream identifiers, organization, employee, amount, timestamps, payload hash, numeric encoding, nonce, and replay/consumed-message state. Native tests cover authorization, account relationships, token configuration, amount and time constraints, overflow, and lifecycle transitions.

Known gaps include:

- Production-ready company onboarding and employee invitations
- Enterprise roles and approval policies
- Production-grade monitoring, retry, and failover operations
- Commercial billing and support operations
- Legal and compliance operating structure
- Independent security audit
- Validated design-partner demand
- Automated atomic NTT receipt into the Tokenva vault

## Roadmap status

| Milestone | Scope | Status |
|---|---|---|
| M0 | Environment and Solana fundamentals | Complete |
| M1 | Protocol configuration | Complete |
| M2 | Token vault and deposits | Complete |
| M3 | Organization and company treasury | Complete |
| M4 | Payment streams and claims | Complete |
| M5 | Native lifecycle | Complete |
| M6 | Security and comprehensive testing | Complete |
| M7 | Frontend | Complete |
| M8 | Backend and indexer | Complete |
| M9 | EVM gateway | Complete |
| M10 | Wormhole cross-chain messaging | Complete |
| M11 | Cross-chain assets / NTT | Complete |
| M12 | Devnet, documentation, and portfolio packaging | Complete |

**M12 is the final technical milestone.** The next phase is **P1 — Product Definition + Customer Discovery**, outside the M0–M12 technical milestone track.

## License

This project is provided as-is for development and demonstration purposes.
