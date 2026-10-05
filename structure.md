# StreamPay Solana Project Structure

This project contains the on-chain Solana program, the EVM gateway, backend services, and the Next.js frontend.

```text
stream-pay-solana/
├── .anchor/
├── .git/
├── .gitignore
├── .prettierignore
├── Anchor.toml
├── Cargo.lock
├── Cargo.toml
├── M12_REPRODUCIBLE_DEMO.md
├── P1_PRODUCT_DEFINITION.md
├── StreamPay_Product_Roadmap_M0-M12.md
├── app/                              # empty app workspace
├── doc.md
├── readme.md
├── structure.md
├── backend/
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
├── evm-gateway/
│   ├── .env
│   ├── .gitignore
│   ├── deployment.json
│   ├── hardhat.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── remappings.txt
│   ├── tsconfig.json
│   ├── artifacts/
│   │   └── (generated contract artifacts)
│   ├── cache/
│   │   └── (Hardhat build cache)
│   ├── contracts/
│   │   ├── StreamPayEvmGateway.sol
│   │   ├── StreamPayM11Token.sol
│   │   ├── interfaces/
│   │   │   └── IWormhole.sol
│   │   └── mocks/
│   │       └── (mock contracts)
│   ├── ignition/
│   │   └── modules/
│   │       └── (deployment modules)
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
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   └── backend/
│       │   │       └── route.ts
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── ActivityHistory.tsx
│       │   ├── ActivityStats.tsx
│       │   ├── OperationalDashboard.tsx
│       │   ├── WalletButton.tsx
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
│           ├── backend.ts
│           └── pdas.ts
└── (generated build artifacts and caches)
```

## Key folders

- `programs/stream-pay-solana/`: on-chain Solana program and Rust source.
- `evm-gateway/`: Solidity contracts, scripts, and deployment tooling.
- `backend/`: TypeScript services for indexing, alerting, DB, and webhooks.
- `web/`: Next.js frontend application and client-side providers.
- `target/`: generated build artifacts and cache output.
- `idls/`: Wormhole and cross-chain interface definitions.
