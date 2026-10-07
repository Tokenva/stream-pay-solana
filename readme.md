# Tokenva

> **Trustless Cross-Chain Asset Streaming & Payroll Protocol**

Tokenva is a **Solana-first programmable payroll and payment-streaming protocol**. It combines organization-managed treasury vaults, time-based payment streams, employee claims, stream lifecycle controls, an EVM gateway, Wormhole cross-chain messaging, and Wormhole NTT asset transfer.

## Current status

| Milestone | Status |
|---|---|
| M0 — Environment + Solana fundamentals | ✅ Complete |
| M1 — Protocol configuration | ✅ Complete |
| M2 — Token vault + deposits | ✅ Complete |
| M3 — Organization + company treasury | ✅ Complete |
| M4 — Payment streams + claims | ✅ Complete |
| M5 — Native lifecycle | ✅ Complete |
| M6 — Security + comprehensive testing | ✅ Complete |
| M7 — Frontend | ✅ Complete |
| M8 — Backend / indexer | ✅ Complete |
| M9 — EVM gateway | ✅ Complete |
| M10 — Wormhole cross-chain messaging | ✅ Complete |
| M11 — Cross-chain assets / NTT | ✅ Complete |
| M12 — Devnet + documentation + portfolio | ✅ Complete |

**M12 is the final technical milestone. There is no M13.**

The latest complete regression recorded in the project context is **41 passed / 0 failed**.

## What Tokenva does

The native Solana payroll flow is:

```text
Company Wallet
      ↓
Organization
      ↓
Tokenva Vault
      ↓
Create Stream
      ↓
Stream Escrow
      ↓
Time-based earning
      ↓
Employee Claim
      ↓
Employee Token Account
```

A stream contains the organization, employee, mint, total amount, start/end times, claimed amount, cancellation state, and related custody accounts. `Stream::earned_amount()` calculates the proportional amount earned over the stream window.

## Cross-chain architecture

Tokenva deliberately separates the **control plane** from the **asset plane**.

### Control plane — cross-chain Tokenva actions

```text
Ethereum Sepolia
      ↓
Tokenva EVM Gateway
      ↓
Wormhole
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

The gateway supports cross-chain intents for `CreateStream`, `TopUpStream`, and `CancelStream`. The live demonstrations recorded in the project context exercised CreateStream and TopUpStream.

### Asset plane — Wormhole NTT

```text
EVM Sepolia ERC-20
      ↓
Wormhole NTT
      ↓
Solana Devnet SPL token
      ↓
Destination wallet
      ↓
Tokenva Vault deposit
      ↓
Stream Escrow
      ↓
Employee claim
```

The M11 demonstration proved a real Sepolia → Solana NTT transfer. The received asset was then manually deposited into the Tokenva vault before being used by the stream.

> **Important:** M11 does not currently prove an automated atomic `NTT receive → Tokenva Vault` relayer transaction. The demonstrated flow is real NTT transfer followed by a manual Tokenva vault deposit.

### Application / indexing architecture

The frontend uses two data paths:

```text
Native protocol path

Connected wallet → Next.js Web App → Solana Devnet RPC → Tokenva Program
                         ↓
                  signs transactions

Indexed read path

Solana Program → RPC → Stream/Activity Indexers → PostgreSQL → Express API
                                                                  ↓
                                                           Next.js Web App
```

The backend provides indexed/query access; it does not replace the Solana program as the source of truth.

## Core Solana instructions

### Native protocol

- `initialize_protocol`
- `create_organization`
- `initialize_vault`
- `deposit`
- `create_stream`
- `top_up_stream`
- `claim`
- `cancel_stream`

### Cross-chain execution

- `consume_vaa`
- `execute_cross_chain_create_stream`
- `execute_cross_chain_top_up`

## Account model

The main on-chain state types are:

- `ProtocolConfig` — global protocol configuration
- `Organization` — company/authority relationship
- `Stream` — payment schedule and stream state
- Cross-chain configuration / consumed-message state used by the Wormhole execution path

A stream tracks:

```text
organization
employee
mint
vault / escrow accounts
stream ID
total amount
start time
end time
claimed amount
canceled flag / cancel time
bump
```

## Security model

The cross-chain execution path validates, among other things:

- VAA body structure and length
- sequence
- trusted source chain
- trusted emitter
- guardian verification
- payload length
- message version
- action
- destination chain
- destination program
- operation ID
- stream ID
- organization
- employee
- amount
- timestamps
- payload hash
- canonical numeric encoding
- non-zero nonce
- replay / consumed-message state

The native protocol tests also cover unauthorized signers, wrong employee, wrong organization, wrong vault, wrong mint, wrong token program, zero amounts, invalid time ranges, overflow, and invalid lifecycle transitions.

The current project context records:

```text
cross_chain_security.rs  → 19 tests
security.rs              → 13 tests
complete cargo regression → 41 passed / 0 failed
```

This is a **prototype security model**, not a substitute for an independent production security audit.

## Repository structure

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
│   ├── types/
│   └── hardhat.config.ts
├── idls/
├── programs/
│   └── stream-pay-solana/
│       ├── Cargo.toml
│       ├── src/
│       └── tests/
├── target/
└── web/
    └── src/
```

NTT deployment support remains in the separate workspace:

```text
/projects/stream-pay-ntt
```

NTT deployment support remains in the separate workspace for reproducibility. Private key material from that workspace must never be committed.

## Program details

```text
Program ID:
4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS

Anchor:
1.2.0

Solana CLI:
4.1.2 (Agave)

Rust:
1.98.1

Cargo:
1.98.1

AVM:
1.2.0

Development / demo cluster:
Solana Devnet

RPC:
https://api.devnet.solana.com
```

## Solana development

### Prerequisites

- Rust
- Solana CLI
- Anchor CLI

### Install / verify Anchor

```bash
anchor --version
```

The project context records Anchor CLI `1.2.0`.

### Build

```bash
anchor build
```

### Run tests

```bash
cargo test
```

or, when running the full Anchor test workflow:

```bash
anchor test
```

### Local deployment

For local development, use the project's Anchor localnet workflow:

```bash
anchor localnet
anchor deploy
```

For the documented cross-chain prototype evidence, use the configured Solana Devnet deployment rather than assuming localnet state.

## EVM gateway

The EVM gateway is a separate Hardhat project:

```bash
cd evm-gateway
npm install
npx hardhat compile
npx hardhat test
```

Solidity version:

```text
0.8.28
```

For Sepolia operations, create a local `evm-gateway/.env` with:

```text
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
```

Do not commit `.env` or private keys.

### Current canonical Sepolia gateway

```text
0x13a5b0be7F5841Ac2Cb0D07e71bB4209f469F104
```

Older/accidental gateway deployments exist in the project history. The address above is the canonical current gateway reference for documentation.

## Wormhole configuration

```text
Wormhole Sepolia Core:
0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78

Wormhole Solana Devnet Core:
3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5

VAA verification shim:
EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at
```

The trusted Sepolia emitter represented on Solana is the canonical gateway address encoded for the Wormhole emitter configuration.

## M11 NTT deployment

NTT work was performed in:

```text
/projects/stream-pay-ntt
```

NTT CLI used during setup:

```text
1.7.0
```

### EVM side

```text
NTT Manager:
0x794513173F19f845e0f65eaa25E1993d155F9617

Wormhole Transceiver:
0xeD456304d60850A9fE582E34a427005b98eC880f

Tokenva M11 ERC-20:
0x7E37db0F3b62a2b77E206509235da94CC195016D

Decimals:
6
```

The EVM side used locking mode.

### Solana side

```text
NTT Manager:
ntt66yTmjfbc459s9m8zhE948bd79vYwvJayV3pXrr5

Solana token:
6jDvPYSs5qerGyXe3G2FLpFJhFQHHvjbkj9Xi9jYDxhB

Wormhole transceiver:
36tGDqAkiAuaRhLMkHhvR63hJvTojekuacPGRkFDshvq

Mode:
burning
```

The Solana token uses 6 decimals and the legacy SPL Token Program.

### Demonstrated NTT transfer

The recorded transfer command was:

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

```text
0x6c98267887fcdc296ae7f6fd1da091e0dc22df9720dc3e004c7c5ccddaf41b92
0xbfd21e50369c0b4c7a589cae38ada14bcff146072f06a92fcaa2d9a6ae9e2e50
```

Recorded Wormhole sequence:

```text
2
```

WormholeScan reference:

```text
https://wormholescan.io/#/tx/0xbfd21e50369c0b4c7a589cae38ada14bcff146072f06a92fcaa2d9a6ae9e2e50?network=Testnet
```

The destination wallet received the transferred asset. Exactly `1 SPT` was then manually deposited into the Tokenva vault.

## Important live Solana evidence

### Program

```text
4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS
```

### Current vault

```text
2bUM6WJy5F7cfPs2eV3Umhp6cnYjU6L4rbwQ7tMnusCF
```

### Stream #14

```text
Stream:
9jFund1g7mtFfAAxC2uy4FUytMC9QUTqPRhoymASi2MG

Escrow:
928WAuWxyzktSLj7YiG5kbHKpRfDtogsNfTfySb2QJFe
```

### Employee claim

Recorded claim transaction:

```text
CEDLuqHsNURcNZZyKXd5ycmttgXGFaqCnZr8aNFHA4ppcxMqjeSjApeqbMifmFSMf11CTesoKEZgG9Q9112feDN
```

Observed reconciliation:

```text
Employee before: 0
Escrow before:   50

Employee after:  3.296296
Escrow after:    46.703704

3.296296 + 46.703704 = 50.000000
```

## M12 — Final technical milestone complete

M12 is the final technical milestone. The complete technical prototype is now packaged with reproducible documentation, architecture descriptions, deployment identifiers, live transaction evidence, security notes, known limitations, and verification commands.

### M12 completion

```text
M12.1  ✅ Repository documentation
M12.2  ✅ Architecture documentation
M12.3  ✅ Reproducible demo
M12.4  ✅ Final technical evidence
```

### Final verification

```text
Solana / Rust tests   41 passed / 0 failed
EVM Hardhat tests      9 passed / 0 failed
Backend typecheck      PASS
Web lint               PASS
Web production build   PASS
EVM compile            PASS
git diff --check       PASS
git status              CLEAN
```

A non-blocking Rust warning remains in `programs/stream-pay-solana/tests/cross_chain_asset.rs` for an unused `authority_mint` test variable. It does not affect the passing regression.

The final M12 work was committed and pushed as:

```text
61d3755  chore: complete M12 technical packaging
e9d491b  chore: ignore generated EVM types
```

The EVM TypeChain artifacts are generated files; the tracked generated changes were restored after verification and future generated `types/` output is ignored by `evm-gateway/.gitignore`.

### Next phase

The technical milestone track is finished. The next phase is **P1 — Product Definition + Customer Discovery**. No new M13 technical milestone is planned.

## Honest limitations

Tokenva is a technical prototype, not yet a production payroll company.

The project does not yet represent production-ready:

- company onboarding and employee invitation workflows
- enterprise roles and approval policies
- production monitoring / retries / failover
- commercial billing
- support operations
- legal/compliance operating structure
- independent security audit
- validated design-partner demand

The M11 NTT integration has one explicit prototype limitation: the asset transfer itself is real, but the demonstrated path is **NTT → destination wallet → manual Tokenva vault deposit**, not an automated atomic NTT-receive-to-vault relayer.

## License

This project is provided as-is for development and demonstration purposes.
