# StreamPay Solana Project Structure

This project is organized into a Solana program, an EVM gateway, backend services, and a web app.

```text
stream-pay-solana/
├── Anchor.toml
├── Cargo.toml
├── rust-toolchain.toml
├── deployment.json
├── doc.md
├── readme.md
├── structure.md
├── M12_REPRODUCIBLE_DEMO.md
├── P1_PRODUCT_DEFINITION.md
├── StreamPay_Product_Roadmap_M0-M12.md
│
├── app/
│   └── (application or UI-related files)
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── activityIndexer.ts
│       ├── alerts.ts
│       ├── audit.ts
│       ├── db.ts
│       ├── index.ts
│       ├── indexer.ts
│       ├── logger.ts
│       ├── solana.ts
│       └── webhooks.ts
│
├── evm-gateway/
│   ├── hardhat.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── deployment.json
│   ├── remappings.txt
│   ├── artifacts/
│   ├── cache/
│   ├── contracts/
│   │   ├── StreamPayEvmGateway.sol
│   │   ├── StreamPayM11Token.sol
│   │   ├── interfaces/
│   │   └── mocks/
│   ├── ignition/
│   │   └── modules/
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
│   │   ├── publish-top-up.ts
│   │   └── ...
│   ├── test/
│   │   └── StreamPayEvmGateway.ts
│   └── types/
│       └── ethers-contracts/
│
├── idls/
│   └── wormhole_verify_vaa_shim.json
│
├── programs/
│   └── stream-pay-solana/
│       ├── Cargo.toml
│       ├── src/
│       └── tests/
│
├── target/
│   ├── debug/
│   ├── deploy/
│   ├── flycheck0/
│   ├── idl/
│   ├── release/
│   ├── sbpfv3-solana-solana/
│   └── tmp/
│
├── web/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── idl/
│       └── lib/
│
└── generated/build artifacts and caches
    └── (compiled contract output, generated ids, etc.)
```

## Main responsibilities

- `programs/stream-pay-solana/`: Solana on-chain program and tests.
- `evm-gateway/`: Solidity contracts, deployment scripts, and EVM integration logic.
- `backend/`: TypeScript services for indexing, alerts, DB, and webhook processing.
- `web/`: Next.js frontend application.
- `idls/`: ABI/IDL artifacts used for cross-chain integrations.

This structure gives a quick overview of the project layout and where the main code lives.
