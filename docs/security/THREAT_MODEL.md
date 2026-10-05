cd /projects/stream-pay-solana
cat > docs/security/THREAT_OPERATION.md <<'EOF'
# StreamPay — Threat Operations

## Production Threat Model, Security Operations, Incident Response, Detection, Containment, Recovery

---

# 1. Purpose

This document defines the complete threat-operation model for StreamPay.

It covers:

- assets
- trust boundaries
- attacker capabilities
- security objectives
- Solana threats
- EVM threats
- Wormhole/cross-chain threats
- backend threats
- frontend threats
- RPC threats
- database threats
- secrets and key threats
- privileged-operation threats
- monitoring
- detection
- incident classification
- incident response
- containment
- evidence preservation
- recovery
- reconciliation
- post-incident review
- residual risks
- production security assumptions

The current StreamPay technical prototype uses:

- Solana Devnet
- EVM Sepolia/Testnet
- Wormhole cross-chain messaging
- Wormhole NTT asset transfer
- Next.js frontend
- PostgreSQL backend/indexer

This document describes the operational security model. It is not an independent security audit or legal opinion.

---

# 2. Security Objectives

StreamPay must preserve:

1. Authorization
2. Transaction integrity
3. Stream ownership
4. Organization integrity
5. Employee integrity
6. Replay protection
7. Cross-chain message integrity
8. Treasury safety
9. Availability
10. Auditability
11. Backend secret confidentiality
12. Key confidentiality
13. Correct blockchain-to-database reconciliation
14. Correct cross-chain state transitions
15. Controlled privileged operations

---

# 3. Protected Assets

## 3.1 Solana assets

- Treasury/vault balances
- Stream escrow balances
- Employee payment rights
- Stream state
- Organization state
- Cross-chain stream mappings
- Cross-chain configuration
- Protocol configuration
- Program upgrade authority
- Token balances

## 3.2 EVM assets

- EVM gateway state
- Stream state
- operation IDs
- gateway ownership
- gateway pause state
- Wormhole configuration
- cross-chain message authority

## 3.3 Backend assets

- PostgreSQL records
- transaction records
- cross-chain message records
- activity/indexer records
- operational state
- audit logs
- API credentials
- RPC configuration

## 3.4 Secret assets

- Solana upgrade authority key
- EVM deployment/owner key
- backend API key
- RPC credentials
- Wormhole operational credentials
- any future guardian/signing credentials
- deployment credentials

## 3.5 Operational assets

- deployment artifacts
- configuration
- logs
- incident evidence
- backups
- reconciliation records
- release history

---

# 4. System Trust Boundaries

```text
                         UNTRUSTED
                            │
                            ▼
                    ┌────────────────┐
                    │    Browser     │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Next.js BFF    │
                    └───────┬────────┘
                            │
                    private server-side
                       authentication
                            │
                            ▼
                    ┌────────────────┐
                    │ Backend / API  │
                    └───────┬────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          ┌──────────────┐      ┌──────────────┐
          │ Solana RPC  │      │ PostgreSQL   │
          └──────┬───────┘      └──────────────┘
                 │
                 ▼
          ┌──────────────┐
          │ Solana       │
          │ StreamPay    │
          │ Program      │
          └──────┬───────┘
                 │
            Wormhole VAA
                 │
                 ▼
          ┌──────────────┐
          │ EVM Gateway  │
          └──────────────┘