# Tokenva Solana Project Structure

This repository combines a Solana Anchor program, an EVM gateway, a TypeScript backend, and a Next.js frontend. The tree below is intentionally source-focused: it includes the project-relevant application and infrastructure files, while excluding generated dependency/build artifacts such as `node_modules`, `.next`, `target`, and cache output.

```text
stream-pay-solana/
├── .gitignore
├── .prettierignore
├── Anchor.toml
├── Cargo.lock
├── Cargo.toml
├── deployment.json
├── readme.md
├── rust-toolchain.toml
├── app/                                  # workspace scaffold / empty wrapper
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── activityIndexer.ts
│       ├── alerts.ts
│       ├── application.ts
│       ├── audit.ts
│       ├── auth.ts
│       ├── company.ts
│       ├── crossChain.ts
│       ├── db.ts
│       ├── index.ts
│       ├── indexer.ts
│       ├── logger.ts
│       ├── solana.ts
│       └── webhooks.ts
├── docs/
│   ├── M12_REPRODUCIBLE_DEMO.md
│   ├── P1_PRODUCT_DEFINITION.md
│   ├── Tokenva_Product_Roadmap_M0-M12.md
│   ├── TOKENVA_COMPLETE_PROJECT_CONTEXT.md
│   ├── doc.md
│   ├── security/
│   │   └── THREAT_MODEL.md
│   └── structure.md
├── evm-gateway/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── deployment.json
│   ├── hardhat.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── remappings.txt
│   ├── tsconfig.json
│   ├── contracts/
│   │   ├── TokenvaEvmGateway.sol
│   │   ├── TokenvaM11Token.sol
│   │   ├── interfaces/
│   │   │   └── IWormhole.sol
│   │   └── mocks/
│   │       └── MockWormhole.sol
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
│   │   └── TokenvaEvmGateway.ts
│   └── types/
│       └── ethers-contracts/
│           ├── TokenvaEvmGateway.ts
│           ├── TokenvaM11Token.ts
│           ├── common.ts
│           ├── hardhat.d.ts
│           ├── index.ts
│           ├── factories/
│           │   ├── TokenvaEvmGateway__factory.ts
│           │   ├── TokenvaM11Token__factory.ts
│           │   ├── index.ts
│           │   ├── interfaces/
│           │   │   ├── IWormhole__factory.ts
│           │   │   └── index.ts
│           │   └── mocks/
│           │       ├── MockWormhole__factory.ts
│           │       └── index.ts
│           ├── interfaces/
│           │   ├── IWormhole.ts
│           │   └── index.ts
│           └── mocks/
│               ├── MockWormhole.ts
│               └── index.ts
├── idls/
│   └── wormhole_verify_vaa_shim.json
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
│       │       ├── cross_chain.rs
│       │       ├── cross_chain_action.rs
│       │       ├── cross_chain_asset.rs
│       │       ├── cross_chain_cancel.rs
│       │       ├── cross_chain_top_up.rs
│       │       ├── deposit.rs
│       │       ├── initialize_organization_policy.rs
│       │       ├── initialize_organization_roles.rs
│       │       ├── initialize_protocol.rs
│       │       ├── initialize_vault.rs
│       │       ├── top_up_stream.rs
│       │       └── update_organization_policy.rs
│       └── tests/
│           ├── claim.rs
│           ├── cross_chain_asset.rs
│           ├── cross_chain_security.rs
│           ├── organization.rs
│           ├── protocol_config.rs
│           ├── security.rs
│           ├── stream.rs
│           └── vault.rs
├── web/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── README.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── backend/
│       │   │   │   └── [...path]/route.ts
│       │   │   └── ops/
│       │   │       ├── applications/
│       │   │       │   ├── route.ts
│       │   │       │   └── [applicationId]/route.ts
│       │   │       ├── companies/
│       │   │       │   └── [companyId]/
│       │   │       │       └── pilot/route.ts
│       │   │       ├── login/route.ts
│       │   │       └── logout/route.ts
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── login/
│       │   │   └── page.tsx
│       │   ├── ops/
│       │   │   └── page.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── OperationalDashboard.tsx
│       │   ├── WalletButton.tsx
│       │   ├── activity/
│       │   │   ├── ActivityHistory.tsx
│       │   │   └── ActivityStats.tsx
│       │   ├── company/
│       │   │   ├── ApplicationStatus.tsx
│       │   │   ├── CompanyOnboarding.tsx
│       │   │   └── PilotStatus.tsx
│       │   ├── dashboard/
│       │   │   ├── CompanyOverview.tsx
│       │   │   └── OperationalDashboard.tsx
│       │   ├── payroll/
│       │   │   ├── ActiveStream.tsx
│       │   │   ├── CompanySetup.tsx
│       │   │   ├── CreatePayroll.tsx
│       │   │   ├── EmployeeDirectory.tsx
│       │   │   ├── PayrollReports.tsx
│       │   │   └── TreasuryFunding.tsx
│       │   └── providers/
│       │       └── SolanaProvider.tsx
│       ├── hooks/
│       │   ├── useActivities.ts
│       │   ├── useDeposit.ts
│       │   ├── useIndexedStreams.ts
│       │   ├── useOrganization.ts
│       │   ├── useOrganizationPolicy.ts
│       │   ├── useStream.ts
│       │   ├── useStreamActions.ts
│       │   └── useVault.ts
│       ├── idl/
│       │   ├── stream_pay_solana.json
│       │   └── stream_pay_solana.ts
│       └── lib/
│           ├── anchor.ts
│           ├── application.ts
│           ├── auth.ts
│           ├── backend.ts
│           ├── company.ts
│           ├── ops-server.ts
│           ├── pdas.ts
│           └── ...
└── ...
```

## Project areas

- `programs/stream-pay-solana/`: Solana Anchor program and Rust test suite.
- `evm-gateway/`: Solidity smart contracts, deployment config, and Hardhat scripts.
- `backend/`: TypeScript services for indexing, auth, company logic, and cross-chain processing.
- `web/`: Next.js app with pages, API routes, dashboard components, hooks, IDL bindings, and wallet logic.
- `docs/`: product, roadmap, threat-model, and project context documentation.
- `idls/`: Wormhole verification interface definitions used across stacks.

This structure intentionally excludes generated output such as `target/`, `node_modules/`, `.next/`, build caches, and other transient artifacts, while keeping all source-relevant project files visible.
