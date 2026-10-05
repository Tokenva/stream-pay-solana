# StreamPay Solana Project Structure

This repository combines the on-chain Solana program, the EVM gateway, backend services, and the Next.js dashboard.

```text
stream-pay-solana/
├── .anchor/
├── .git/
├── .gitignore
├── .prettierignore
├── Anchor.toml
├── Cargo.lock
├── Cargo.toml
├── app/                              # app workspace scaffold
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── activityIndexer.ts
│       ├── alerts.ts
│       ├── audit.ts
│       ├── crossChain.ts
│       ├── db.ts
│       ├── index.ts
│       ├── indexer.ts
│       ├── logger.ts
│       ├── solana.ts
│       └── webhooks.ts
├── deployment.json
├── docs/
│   ├── M12_REPRODUCIBLE_DEMO.md
│   ├── P1_PRODUCT_DEFINITION.md
│   ├── StreamPay_Product_Roadmap_M0-M12.md
│   ├── doc.md
│   ├── security/
│   │   └── THREAT_MODEL.md
│   └── structure.md
├── evm-gateway/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── artifacts/
│   ├── cache/
│   ├── contracts/
│   │   ├── StreamPayEvmGateway.sol
│   │   ├── StreamPayM11Token.sol
│   │   ├── interfaces/
│   │   │   └── IWormhole.sol
│   │   └── mocks/
│   ├── deployment.json
│   ├── hardhat.config.ts
│   ├── ignition/
│   │   └── modules/
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── remappings.txt
│   ├── scripts/
│   │   ├── check-protocol-config.ts
│   │   ├── close-vaa-signatures.ts
│   │   ├── consume-vaa.ts
│   │   ├── deploy.ts
│   │   ├── deposit-to-vault.ts
│   │   ├── execute-cross-chain-action.ts
│   │   ├── execute-cross-chain-top-up.ts
│   │   ├── fetch-vaa.ts
│   │   ├── init-cross-chain-asset-config.ts
│   │   ├── init-cross-chain-config.ts
│   │   ├── init-protocol.ts
│   │   ├── init-vault.ts
│   │   ├── post-vaa-signatures.ts
│   │   ├── publish-next-message.ts
│   │   └── publish-top-up.ts
│   ├── test/
│   │   └── StreamPayEvmGateway.ts
│   ├── tsconfig.json
│   └── types/
│       └── ethers-contracts/
├── idls/
│   └── wormhole_verify_vaa_shim.json
├── programs/
│   └── stream-pay-solana/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── constants.rs
│       │   ├── error.rs
│       │   ├── instructions/
│       │   │   ├── cancel_stream.rs
│       │   │   ├── claim.rs
│       │   │   ├── create_organization.rs
│       │   │   ├── create_stream.rs
│       │   │   ├── cross_chain.rs
│       │   │   ├── cross_chain_action.rs
│       │   │   ├── cross_chain_asset.rs
│       │   │   ├── cross_chain_top_up.rs
│       │   │   ├── deposit.rs
│       │   │   ├── initialize_organization_policy.rs
│       │   │   ├── initialize_organization_roles.rs
│       │   │   ├── initialize_protocol.rs
│       │   │   ├── initialize_vault.rs
│       │   │   ├── top_up_stream.rs
│       │   │   └── update_organization_policy.rs
│       │   ├── instructions.rs
│       │   ├── lib.rs
│       │   └── state.rs
│       └── tests/
│           ├── claim.rs
│           ├── cross_chain_asset.rs
│           ├── cross_chain_security.rs
│           ├── organization.rs
│           ├── protocol_config.rs
│           ├── security.rs
│           ├── stream.rs
│           └── vault.rs
├── readme.md
├── rust-toolchain.toml
├── target/
│   ├── debug/
│   ├── deploy/
│   ├── flycheck0/
│   ├── idl/
│   ├── release/
│   ├── sbpfv3-solana-solana/
│   └── tmp/
├── web/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .next/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── README.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── backend/
│   │   │   │       └── route.ts
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── OperationalDashboard.tsx
│   │   │   ├── WalletButton.tsx
│   │   │   ├── activity/
│   │   │   │   ├── ActivityHistory.tsx
│   │   │   │   └── ActivityStats.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── CompanyOverview.tsx
│   │   │   │   └── OperationalDashboard.tsx
│   │   │   ├── payroll/
│   │   │   │   ├── ActiveStream.tsx
│   │   │   │   ├── CompanySetup.tsx
│   │   │   │   ├── CreatePayroll.tsx
│   │   │   │   ├── EmployeeDirectory.tsx
│   │   │   │   ├── PayrollReports.tsx
│   │   │   │   └── TreasuryFunding.tsx
│   │   │   └── providers/
│   │   │       └── SolanaProvider.tsx
│   │   ├── hooks/
│   │   │   ├── useActivities.ts
│   │   │   ├── useDeposit.ts
│   │   │   ├── useIndexedStreams.ts
│   │   │   ├── useOrganization.ts
│   │   │   ├── useOrganizationPolicy.ts
│   │   │   ├── useStream.ts
│   │   │   ├── useStreamActions.ts
│   │   │   └── useVault.ts
│   │   ├── idl/
│   │   │   ├── stream_pay_solana.json
│   │   │   └── stream_pay_solana.ts
│   │   └── lib/
│   │       ├── anchor.ts
│   │       ├── backend.ts
│   │       └── pdas.ts
│   └── tsconfig.json
└── (generated build artifacts, caches, and installed dependencies)
```

## Key folders

- `programs/stream-pay-solana/`: on-chain Solana program and Rust instruction tests.
- `evm-gateway/`: Solidity contracts, scripts, and Hardhat deployment tooling.
- `backend/`: TypeScript indexing and monitoring services.
- `web/`: Next.js frontend, app routes, hooks, and providers.
- `target/`: generated Rust build artifacts and compiler output.
- `idls/`: cross-chain and Wormhole interface definitions.
- `docs/`: product, roadmap, and architecture documentation.
