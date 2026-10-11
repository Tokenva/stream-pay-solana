# StreamPay Solana Project Structure

This repository combines the Solana Anchor program, the EVM gateway, a TypeScript backend, and a Next.js frontend. The tree below reflects the current live source layout in this workspace and intentionally omits generated dependency/build output such as `target/`, `node_modules/`, `.next/`, `.vercel/`, `artifacts/`, `cache/`, and other transient files.

```text
stream-pay-solana/
├── .backups/
├── .gitignore
├── .prettierignore
├── Anchor.toml
├── Cargo.lock
├── Cargo.toml
├── TokenvaPay_Brand_Assets/
├── TokenvaPay_Brand_Assets.zip
├── app/                                  # wrapper workspace / scaffold
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
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
│       ├── employeeInvitations.ts
│       ├── idl/
│       │   └── stream_pay_solana.json
│       ├── index.ts
│       ├── indexer.ts
│       ├── logger.ts
│       ├── solana.ts
│       └── webhooks.ts
├── deployment.json
├── docs/
│   ├── M12_REPRODUCIBLE_DEMO.md
│   ├── P1_PRODUCT_DEFINITION.md
│   ├── TOKENVA_COMPLETE_PROJECT_CONTEXT.md
│   ├── Tokenva_Product_Roadmap_M0-M12.md
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
│   ├── package.json
│   ├── package-lock.json
│   ├── remappings.txt
│   ├── tsconfig.json
│   ├── contracts/
│   │   ├── StreamPayEvmGateway.sol
│   │   ├── StreamPayM11Token.sol
│   │   ├── interfaces/
│   │   │   └── IWormhole.sol
│   │   └── mocks/
│   │       └── MockWormhole.sol
│   ├── ignition/
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
├── readme.md
├── rust-toolchain.toml
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
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── backend/
│       │   │   │   └── [...path]/
│       │   │   │       └── route.ts
│       │   │   ├── config/
│       │   │   │   └── route.ts
│       │   │   └── ops/
│       │   │       ├── applications/
│       │   │       │   ├── route.ts
│       │   │       │   └── [applicationId]/
│       │   │       │       └── route.ts
│       │   │       ├── companies/
│       │   │       │   └── [companyId]/
│       │   │       │       └── pilot/
│       │   │       │           └── route.ts
│       │   │       ├── login/
│       │   │       │   └── route.ts
│       │   │       └── logout/
│       │   │           └── route.ts
│       │   ├── app/
│       │   │   └── page.tsx
│       │   ├── how-it-works/
│       │   │   └── page.tsx
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── join/
│       │   │   └── [code]/
│       │   │       └── page.tsx
│       │   ├── layout.tsx
│       │   ├── login/
│       │   │   └── page.tsx
│       │   ├── not-found.tsx
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
│       │   │   ├── EmployeeWorkspace.tsx
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
│           └── pdas.ts
└── ...
```

## Project areas

- `programs/stream-pay-solana/`: Solana Anchor program and Rust test suite.
- `evm-gateway/`: Solidity smart contracts, deployment config, and Hardhat scripts.
- `backend/`: TypeScript services for indexing, auth, company logic, employee invitations, and cross-chain processing.
- `web/`: Next.js app with pages, API routes, dashboard views, hooks, IDL bindings, join flow, and wallet logic.
- `docs/`: product, roadmap, threat-model, and project context documentation.
- `idls/`: Wormhole verification interface definitions used across stacks.
- `app/`: workspace wrapper and container scaffold.
- `TokenvaPay_Brand_Assets/`: brand assets and project artwork.
- `.backups/`: local backup snapshots retained in the workspace.

This structure intentionally excludes generated output such as `target/`, `node_modules/`, `.next/`, `.vercel/`, `cache/`, `artifacts/`, and other transient files while keeping the source-relevant project files visible.
