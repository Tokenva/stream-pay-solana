# StreamPay — Master Roadmap
## From Technical Prototype → Product → Paid Production Service

**Project:** StreamPay  
**Current technical milestone range:** M0–M12  
**Final technical milestone:** M12  
**Product direction:** Programmable Stablecoin Payroll for Global Crypto-Native Teams

---

# 1. Purpose of This Roadmap

This is the new master roadmap for continuing StreamPay in an orderly way.

It reconciles the earlier M0–M12 technical roadmap with the current project state and then adds the work required to turn the technical prototype into a real product.

**Important rules:**

- M0–M12 remains the technical milestone system.
- M12 is the final technical milestone. There is no M13.
- Productization after M12 is organized into **Product Phases (P1–P9)**, not new M milestones.
- We will not modify code based on assumptions.
- Whenever implementation is required, the exact relevant files/code will be requested first.
- A passing test is evidence only for what that test actually covers.
- Customer demand must be validated before large product expansion.

---

# 2. Current Position

## Technical prototype

The current project is a working technical prototype with:

- Solana payroll/payment streams
- organization and vault architecture
- token deposits
- stream creation
- time-based earning
- employee claims
- native top-up
- native cancellation
- security test suite
- Next.js frontend
- PostgreSQL/indexer backend
- EVM gateway
- Wormhole cross-chain messaging
- real Sepolia → Wormhole → Solana demonstrations

The latest `anchor test` run completed with:

**21 tests passed / 0 failed**

including **13 security tests**.

## What the prototype is NOT yet

It is not yet a production payroll product with:

- company onboarding
- employee onboarding/invitations
- roles and approvals
- production-grade monitoring/retries
- full payroll workflows
- customer billing
- support operations
- legal/compliance structure
- independent security audit
- validated design-partner demand
- a completed actual EVM → Solana asset bridge

---

# 3. Reconciled M0–M12 Technical Roadmap

| Milestone | Area | Current Status | Remaining Work |
|---|---|---|---|
| M0 | Environment + Solana fundamentals | ✅ Complete | None for current prototype |
| M1 | Protocol configuration | ✅ Complete | None |
| M2 | Token vault + deposits | ✅ Complete | None for prototype |
| M3 | Organization + company vault | ✅ Complete | None for prototype |
| M4 | Payment streams + claim | ✅ Complete | None for prototype |
| M5 | Native claim / top-up / cancel lifecycle | ✅ Complete | None for prototype |
| M6 | Security + comprehensive tests | 🟡 Almost complete | Add dedicated cross-chain negative/replay tests and rerun regression |
| M7 | Frontend | ✅ Complete | Product UX comes later in P2/P3 |
| M8 | Backend / indexer | ✅ Complete | Production hardening comes later in P4 |
| M9 | EVM gateway | ✅ Complete | Production hardening later |
| M10 | Cross-chain messaging | ✅ Complete | More production observability later |
| M11 | Cross-chain assets | ⏳ Pending | Decide and implement actual asset-transfer mechanism; test end-to-end |
| M12 | Devnet + docs + portfolio | 🟡 Partial | Finalize reproducibility, architecture, docs, demo package |

### Technical completion target

The technical prototype reaches its final state when **M6 + M11 + M12** are complete.

---

# 4. M6 — Finish Security

## Goal

Close the remaining security-test gap around cross-chain execution.

## Already covered

Native security tests currently cover areas such as:

- wrong signer
- zero stream amount
- invalid stream time range
- unauthorized employee claim
- top-up after stream start
- double cancellation
- claim after cancellation
- wrong organization
- wrong vault
- wrong mint
- wrong token program
- top-up zero amount
- top-up arithmetic overflow

## Cross-chain protections already present in code

The cross-chain path validates things including:

- VAA body length
- sequence
- trusted source chain
- trusted emitter
- Wormhole guardian verification
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

## Remaining M6 test work

Add focused adversarial tests for the cross-chain path, such as:

1. invalid VAA source chain
2. invalid emitter
3. invalid destination chain
4. invalid destination program
5. invalid payload/version/action
6. mismatched sequence
7. manipulated payload / payload-hash mismatch
8. mismatched operation ID / stream ID
9. replay/duplicate consumed message path
10. invalid numeric payload words where applicable

## M6 exit criteria

- all new cross-chain negative tests pass
- all existing tests continue to pass
- `anchor test` remains fully green
- no security test relies on a false positive

**Only after this is verified should M6 be marked ✅.**

---

# 5. M11 — Finish Cross-Chain Assets

## Goal

Implement the actual asset-transfer/funding layer between chains.

## Current state

The current system proves cross-chain **message execution** and can move existing Solana-side tokens from the vault into stream escrow.

The current `CrossChainAssetConfig` only configures a settlement mint; it does not itself perform an EVM → Solana bridge.

## Required design decision

Before code changes, decide the asset mechanism:

- Wormhole NTT / native token transfer approach, or
- a deliberately simpler custom bridge/lock-mint settlement model for the prototype.

This choice must be made before implementation.

## M11 implementation stages

### M11.1 — Asset model

Define:

- source asset
- destination asset
- supported chain(s)
- mint mapping
- custody model
- settlement rules
- replay protection

### M11.2 — Source-chain asset transfer

Implement the EVM-side asset movement required by the chosen design.

### M11.3 — Destination-chain settlement

Implement the Solana-side asset receipt/settlement flow.

### M11.4 — Link asset funding to StreamPay

Target flow:

```text
Source Chain Asset
        ↓
Cross-chain transfer
        ↓
Solana settlement
        ↓
StreamPay Vault
        ↓
Stream Escrow
        ↓
Employee claim
```

### M11.5 — Security tests

Test at minimum:

- correct amount
- correct destination
- correct token/mint
- replay rejection
- unauthorized source rejection
- wrong recipient rejection
- wrong message rejection
- final balance reconciliation

### M11 exit criteria

A real asset must successfully move/fund the destination-side StreamPay flow end-to-end, with tests proving correctness and replay protection.

---

# 6. M12 — Finish Technical Prototype Packaging

## Goal

Make the complete technical prototype reproducible and understandable by another developer.

## M12 work

### M12.1 — Repository documentation

Clean and reconcile:

- `readme.md`
- `doc.md`
- setup commands
- toolchain versions
- environment variables
- Devnet configuration
- EVM gateway deployment information
- Wormhole flow
- cross-chain asset flow

### M12.2 — Architecture documentation

Create diagrams for:

1. Native Solana payroll flow
2. EVM → Wormhole → Solana message flow
3. Asset flow
4. Frontend → backend → Solana/indexer architecture

### M12.3 — Reproducible demo

Document a clean end-to-end run:

```text
Install
  ↓
Build
  ↓
Test
  ↓
Deploy
  ↓
Initialize
  ↓
Fund vault
  ↓
Create stream
  ↓
Claim
  ↓
Cross-chain action
  ↓
Verify balances
```

### M12.4 — Final technical evidence

Record:

- program ID
- EVM gateway address
- Devnet/Sepolia configuration
- important transaction links/hashes
- test results
- screenshots
- final architecture

### M12 exit criteria

Another developer should be able to understand the architecture and reproduce the documented prototype flow without needing private verbal instructions.

---

# 7. PRODUCTIZATION STARTS AFTER M12

Once M6, M11 and M12 are closed, do **not** immediately build a huge commercial product.

The next track is **P1–P9**.

The purpose of the product track is to answer a different question:

> Can this working protocol solve a sufficiently painful business problem that customers will trust and pay for it?

---

# 8. P1 — Product Definition + Customer Discovery

## Goal

Convert the technology into a clear customer problem.

## Product direction

Working product concept:

> **Programmable stablecoin payroll for global crypto-native teams.**

The product should not be sold primarily as “Wormhole + Solana + cross-chain technology.” Those are implementation details.

## Primary initial customer

Focus on crypto-native companies that:

- already use stablecoins
- have international workers/contractors
- pay recurring compensation
- operate a remote or distributed team
- have a founder/finance/operations owner of payroll

## Buyer roles

Likely buyer/user roles to validate:

- founder
- COO
- CFO/finance lead
- treasury lead
- operations lead

## Customer discovery

Conduct approximately 20–30 interviews before major expansion.

Questions should focus on the current workflow:

- How are contractors paid today?
- Which countries are involved?
- Which assets/currencies are used?
- Who creates and approves payroll?
- How long does the process take?
- What fails most often?
- How much manual reconciliation occurs?
- What happens when a payment fails?
- Are stablecoins already used?
- Would continuous/programmable compensation solve a real problem?
- Would they pay for it?

## P1 exit criteria

We have evidence of a repeatable pain point, a clearly defined early customer profile, and a reason those customers would consider paying for StreamPay.

---

# 9. P2 — Product UX + Company Onboarding

## Goal

Turn the existing developer-oriented dashboard into a business application.

## Build

### Company onboarding

```text
Create company
    ↓
Connect treasury wallet
    ↓
Select supported asset
    ↓
Configure payroll settings
```

### Employee onboarding

```text
Invite employee
    ↓
Employee connects wallet
    ↓
Verify wallet
    ↓
Employee becomes payable
```

### Dashboard

Show business information first:

- treasury balance
- payroll this month
- active streams
- pending actions
- employee count
- recent activity

## P2 exit criteria

A non-developer can understand the app and complete basic onboarding without reading the smart contract code.

---

# 10. P3 — Payroll + Treasury Controls

## Goal

Move from “stream demo” to an actual finance workflow.

## Core features

- employee directory
- payroll creation
- stream templates
- salary streams
- contractor streams
- bonuses
- top-up
- cancel
- pause/approval flow where appropriate

## Treasury controls

Add a permission model such as:

```text
Owner
Admin
Finance
Approver
Viewer
Employee
```

And policy controls such as:

- approved assets
- approved chains
- transaction limits
- payroll limits
- per-employee limits
- approval requirements

## P3 exit criteria

A small company can run a complete payroll workflow through StreamPay using defined roles and controls.

---

# 11. P4 — Production Backend + Reliability

## Goal

Make the system reliable enough that a payroll failure becomes an observable operational event, not a mystery.

## Build

- transaction status tracking
- cross-chain message status
- retries
- queue/worker architecture where needed
- RPC failover
- monitoring
- structured logs
- alerts
- webhook system
- audit logs
- operational dashboards
- reconciliation jobs

## Example status model

```text
Created
  ↓
Submitted
  ↓
Confirmed on source chain
  ↓
Message observed
  ↓
VAA available
  ↓
Destination submitted
  ↓
Destination confirmed
```

## P4 exit criteria

Operators can see what happened to every important payroll action and can diagnose/recover normal failures.

---

# 12. P5 — Finance + Accounting Layer

## Goal

Make blockchain activity useful to finance teams.

## Build

- payroll reports
- employee reports
- treasury reports
- transaction exports
- CSV export
- monthly payroll summary
- reconciliation tools
- accounting integration plan

Example dashboard:

```text
October Payroll

Employees:       48
Gross payout:    $184,500
Completed:       46
Pending:          2
Network fees:    $42

[Export CSV]
```

## P5 exit criteria

Finance can understand what was paid, to whom, when, and how much, without using a blockchain explorer.

---

# 13. P6 — Security + Legal/Compliance Readiness

## Goal

Prepare the product for real customer money and real customer contracts.

## Security

- complete M6
- production threat model
- smart-contract audit
- dependency review
- frontend security review
- backend security review
- secrets/key management review
- incident response process

## Legal/compliance

The exact requirements depend on the final operating model and jurisdictions.

Before customer funds are accepted, obtain professional legal advice on:

- custody vs non-custody
- money transmission/payment services
- virtual asset service requirements
- AML/KYC obligations where applicable
- stablecoin rules
- data/privacy obligations
- customer agreements
- terms of service
- privacy policy

## Important product principle

Avoid unnecessarily becoming an:

- exchange
- stablecoin issuer
- fiat banking provider
- custodian

at the beginning.

Keep the commercial architecture as simple as the legal model allows.

## P6 exit criteria

A defined legal operating model exists, the production security posture is independently reviewed, and the company knows what it can and cannot offer in its target jurisdictions.

---

# 14. P7 — Design-Partner Pilot

## Goal

Use a small number of real companies to prove the workflow.

Target:

**3–5 design partners**

Pilot structure:

```text
5–20 workers
        ↓
small payroll volume
        ↓
manual onboarding/support
        ↓
30-day+ pilot
```

## Measure

- setup time
- payroll processing time
- payment failures
- manual work
- reconciliation effort
- user errors
- employee experience
- finance satisfaction
- willingness to continue
- willingness to pay

## P7 exit criteria

Real companies complete the workflow and provide evidence that the product solves a valuable problem.

---

# 15. P8 — Paid MVP

## Goal

Convert pilot usage into paid recurring customers.

## Possible pricing model to test

A hybrid model can be evaluated:

```text
monthly SaaS fee
+
usage/payment-processing fee
```

Do not assume the final price before customer discovery.

Test pricing against:

- number of employees
- payroll volume
- number of companies
- API usage
- support level

## P8 exit criteria

At least some customers are willing to pay under real conditions, and the product delivers enough value to retain them.

---

# 16. P9 — Scale the Product

Only after repeatable demand is proven.

## Expansion path

```text
Stablecoin payroll
      ↓
More chains
      ↓
Actual cross-chain asset infrastructure
      ↓
Payroll API
      ↓
Webhooks
      ↓
Accounting integrations
      ↓
Vesting
      ↓
Bonuses
      ↓
Milestone payments
      ↓
Programmable payment infrastructure
```

Potential future customers:

- fintech platforms
- payroll providers
- marketplaces
- crypto wallets
- DAO/foundation platforms
- accounting/payment platforms

The long-term business can evolve from a direct payroll application toward programmable payment infrastructure.

---

# 17. Product Architecture — Target State

```text
                    STREAM PAY PRODUCT
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Frontend         Backend         Blockchain
          │                │                │
      Dashboard       API/Indexer      Solana Program
      Employees       PostgreSQL       EVM Gateway
      Payroll         Webhooks         Wormhole
      Treasury        Monitoring       Asset Layer
          │                │                │
          └────────────────┼────────────────┘
                           │
                       Operations
                           │
                 Security / Compliance
                           │
                       Customers
```

---

# 18. Product Customer Flow — Target State

```text
Company signs up
       ↓
Connect treasury wallet
       ↓
Add employees
       ↓
Define compensation
       ↓
Prepare payroll
       ↓
Approval
       ↓
Fund payroll
       ↓
Create streams
       ↓
Employees accrue earnings
       ↓
Employees claim
       ↓
Finance sees reports
       ↓
Month closes / next payroll begins
```

The blockchain should make this workflow trustworthy without forcing the customer to understand blockchain internals.

---

# 19. The Most Important Product Principle

Do not build around:

> “We use Solana/Wormhole.”

Build around:

> **“We make global stablecoin compensation programmable, controllable and auditable.”**

Technology enables the product. The customer problem defines the product.

---

# 20. Prototype → Product Transition

```text
CURRENT
Technical prototype
        ↓
M6 security closure
        ↓
M11 asset layer
        ↓
M12 technical packaging
        ↓
P1 customer validation
        ↓
P2 onboarding + UX
        ↓
P3 payroll + treasury controls
        ↓
P4 production reliability
        ↓
P5 finance/accounting
        ↓
P6 security + legal/compliance
        ↓
P7 design-partner pilot
        ↓
P8 paid MVP
        ↓
P9 scale
```

---

# 21. What We Should NOT Do

Do not start by adding everything at once.

Avoid initially building:

- dozens of chains
- dozens of tokens
- consumer wallet features
- your own exchange
- your own stablecoin
- fiat banking infrastructure
- unnecessary custody
- a huge HR platform

The first product should prove one valuable workflow very well.

---

# 22. Execution Rules for Our Future Work

For every technical task:

1. We identify the exact milestone/phase.
2. We identify the exact requirement.
3. We request the exact files/code needed.
4. You provide them.
5. Only then do we modify code or take technical action.
6. We run the smallest useful verification command.
7. We inspect the result.
8. Only then do we mark the task complete.

No assumed file contents.
No invented implementation details.
No marking a milestone complete just because similar functionality exists elsewhere.

---

# 23. Immediate Execution Order

## NEXT — M6

Finish cross-chain security tests.

## THEN — M11

Make the actual cross-chain asset mechanism decision and implement/test it.

## THEN — M12

Finish technical documentation, architecture and reproducibility.

## THEN — P1

Start customer discovery before major commercial feature expansion.

## THEN — P2/P3

Turn the developer prototype into a usable company payroll product.

## THEN — P4/P5/P6

Harden reliability, finance workflows, security, legal and compliance.

## THEN — P7/P8

Run pilots and convert successful pilots into paid customers.

## FINALLY — P9

Scale and expand into programmable payment infrastructure.

---

# 24. Definition of Done

The project is no longer just a technical prototype when all of the following are true:

- the core technical flow is complete and tested
- cross-chain asset movement is real and tested
- documentation is reproducible
- a target customer problem is validated
- real design partners use the product
- customers can onboard without developer assistance
- payroll can be prepared and approved
- transactions are observable and recoverable
- financial records can be reconciled
- security and legal requirements for the operating model are addressed
- customers pay for the service
- the product can support those customers reliably

At that point StreamPay has crossed from **project** to **product/business**.
