# StreamPay — M12 Reproducible Demo

## Purpose

This document records the verified StreamPay prototype flow for another developer.

The prototype has four demonstrated paths:

1. Native Solana payroll
2. EVM → Wormhole cross-chain messaging
3. Wormhole NTT asset transfer
4. Manual StreamPay vault funding after NTT receipt

The demonstrated M11 asset path is:

```text
EVM Sepolia
    ↓
Wormhole NTT
    ↓
Solana Devnet destination wallet
    ↓
Manual StreamPay Vault deposit
    ↓
Stream Escrow
    ↓
Employee claim
```

The prototype does not claim an automated atomic `NTT receive → StreamPay Vault` relayer.

---

## 1. Verified Toolchain

```text
Rust        1.98.1
Cargo       1.98.1
Solana CLI  4.1.2
Anchor CLI  1.2.0
AVM         1.2.0
Next.js     16.3.8
Solidity    0.8.28
```

Solana cluster:

```text
Devnet
```

RPC:

```text
https://api.devnet.solana.com
```

Program ID:

```text
4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS
```

---

## 2. Solana Build and Tests

From the repository root:

```bash
cd /projects/stream-pay-solana
anchor build
cargo test
```

Recorded regression:

```text
41 passed
0 failed
```

---

## 3. Backend

```bash
cd /projects/stream-pay-solana/backend
npm install
npm run typecheck
npm start
```

The backend provides indexed/query access.

The Solana program remains the protocol source of truth.

---

## 4. Web Application

```bash
cd /projects/stream-pay-solana/web
npm install
npm run lint
npm run build
npm run dev
```

The web application uses Next.js, Solana Devnet, the StreamPay Solana program, the Express backend, and PostgreSQL-backed indexing.

---

## 5. EVM Gateway

```bash
cd /projects/stream-pay-solana/evm-gateway
npm install
npx hardhat compile
npx hardhat test
```

Canonical Sepolia gateway:

```text
0x13a5b0be7F5841Ac2Cb0D07e71bB4209f469F104
```

Wormhole Sepolia Core:

```text
0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78
```

---

## 6. Cross-Chain Message Flow

```text
EVM Sepolia
    ↓
StreamPay EVM Gateway
    ↓
Wormhole
    ↓
Signed VAA
    ↓
Solana VAA verification shim
    ↓
consume_vaa
    ↓
Cross-chain StreamPay action
```

Solana Wormhole Core:

```text
3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5
```

VAA verification shim:

```text
EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at
```

---

## 7. Publish a Cross-Chain Message

```bash
cd /projects/stream-pay-solana/evm-gateway
npx hardhat run scripts/publish-next-message.ts --network sepolia
```

Record the printed:

```text
Gateway transaction
Operation ID
Stream ID
Gateway nonce
Wormhole sequence
```

---

## 8. Fetch the Signed VAA

```bash
GATEWAY_TX_HASH=<GATEWAY_TRANSACTION_HASH> \
npx tsx scripts/fetch-vaa.ts
```

Successful retrieval creates:

```text
artifacts/cross-chain/vaa.json
artifacts/cross-chain/vaa-body.bin
```

The VAA body format used by the StreamPay scripts is:

```text
0..3     timestamp
4..7     nonce
8..9     emitter chain
10..41   emitter address
42..49   sequence
50       consistency
51..     StreamPay payload
```

The StreamPay payload is 416 bytes.

---

## 9. Process the VAA

```bash
npx tsx scripts/post-vaa-signatures.ts
npx tsx scripts/consume-vaa.ts
```

The VAA is validated and replay protection is applied.

---

## 10. Execute the Cross-Chain Action

```bash
npx tsx scripts/execute-cross-chain-action.ts
```

The execution script reads the actual Wormhole sequence from the VAA body.

---

## 11. Cross-Chain Top-Up

Publish:

```bash
npx hardhat run scripts/publish-top-up.ts --network sepolia
```

Fetch the VAA:

```bash
GATEWAY_TX_HASH=<GATEWAY_TRANSACTION_HASH> \
npx tsx scripts/fetch-vaa.ts
```

Process and execute:

```bash
npx tsx scripts/post-vaa-signatures.ts
npx tsx scripts/consume-vaa.ts
npx tsx scripts/execute-cross-chain-top-up.ts
```

---

## 12. NTT Asset Transfer

The demonstrated asset transfer uses Wormhole NTT.

EVM NTT Manager:

```text
0x794513173F19f845e0f65eaa25E1993d155F9617
```

EVM NTT Transceiver:

```text
0xeD456304d60850A9fE582E34a427005b98eC880f
```

EVM M11 ERC-20:

```text
0x7E37db0F3b62a2b77E206509235da94CC195016D
```

Solana test mint:

```text
6jDvPYSs5qerGyXe3GFLpFJhFQHHvjbkj9Xi9jYDxhB
```

Recorded transfer:

```bash
cd /projects/stream-pay-ntt

ntt token-transfer \
  --network Testnet \
  --source-chain Sepolia \
  --destination-chain Solana \
  --amount 1 \
  --destination-address 94K4HrLfv3Ra8o8iCxi5aP8cENt2HBSMkycnkWnwkz1g \
  --deployment-path ./deployment.json
```

Recorded transactions:

```text
0x6c98267887fcdc296ae7f6fd1da091e0dc22df9720dc3e004c7c5ccddaf41b92
0xbfd21e50369c0b4c7a589cae38ada14bcff146072f06a92fcaa2d9a6ae9e2e50
```

Wormhole sequence:

```text
2
```

---

## 13. NTT → StreamPay Integration

```text
EVM Sepolia
    ↓
Wormhole NTT
    ↓
Solana destination wallet
    ↓
Manual StreamPay Vault deposit
    ↓
Stream Escrow
    ↓
Employee claim
```

The prototype does not claim an automated atomic `NTT receive → StreamPay Vault` relayer.

---

## 14. Verified Live Solana Evidence

Vault:

```text
2bUM6WJy5F7cfPs2eV3Umhp6cnYjU6L4rbwQ7tMnusCF
```

Stream #14:

```text
9jFund1g7mtFfAAxC2uy4FUytMC9QUTqPRhoymASi2MG
```

Escrow:

```text
928WAuWxyzktSLj7YiG5kbHKpRfDtogsNfTfySb2QJFe
```

Claim transaction:

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

---

## 15. Security

Never commit:

```text
.env
private keys
seed phrases
guardian keypair secret material
temporary credentials
```

Public deployment identifiers and transaction signatures may be documented.

---

## 16. Final Verification

```bash
cd /projects/stream-pay-solana

anchor build
cargo test

cd backend
npm run typecheck

cd ../web
npm run lint
npm run build

cd ../evm-gateway
npx hardhat compile
npx hardhat test

cd ..
git diff --check
git status --short
```

Expected:

```text
Solana build       PASS
Rust regression    41 passed / 0 failed
Backend typecheck  PASS
Web lint           PASS
Web build          PASS
EVM compile        PASS
EVM tests          9 passed / 0 failed
git diff --check   PASS
git working tree   CLEAN
```

---

## M12 Exit

```text
Documentation complete
Reproducible demo documented
Technical evidence recorded
Visual screenshots are not claimed as captured; transaction/explorer evidence is recorded for technical verification.
Secrets excluded
Final regression passes
Git review complete
Final commit pushed
```

M12 is the final technical milestone.

Final repository state:

```text
M12 technical package       COMPLETE
Solana / Rust tests         41 passed / 0 failed
EVM Hardhat tests            9 passed / 0 failed
Backend typecheck            PASS
Web lint                     PASS
Web production build         PASS
EVM compile                  PASS
Git working tree             CLEAN

Commit 1: 61d3755
Commit 2: e9d491b
Remote: origin/main updated
```

One non-blocking Rust warning remains for an unused `authority_mint` test variable in `cross_chain_asset.rs`. The regression itself is fully passing.

Next phase: **P1 — Product Definition + Customer Discovery**.
