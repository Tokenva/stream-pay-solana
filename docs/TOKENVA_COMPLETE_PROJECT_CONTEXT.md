# Tokenva — Complete Project Context & Operating Model

> Single-source Markdown document containing the complete current context, roadmap status, architecture, security work, operating model, brand decisions, website status, and next-stage plan for Tokenva.

## 1. Project Identity

**Product:** Tokenva

**Positioning:** Programmable payment infrastructure for global teams.

Tokenva is being developed as non-custodial programmable payment infrastructure for companies with globally distributed employees and contractors.

The initial product direction is stablecoin-based recurring payments/payroll, with cross-chain payment workflows and transparent settlement.

**Former project name:** StreamPay

The technical project was originally developed under the name StreamPay and has now been rebranded to Tokenva. The name decision is considered final.

---

## 2. Brand Decisions

- Company/product name: **Tokenva**
- Domain: **tokenva.io**
- GitHub Organization: **Tokenva**
- LinkedIn Company Page: **Tokenva**
- X handle: **@TokenvaHQ**
- Professional email: planned after domain purchase, e.g. `hello@tokenva.io`

Tokenva is intended to be international, modern, premium, infrastructure-focused, Web3-native, and not positioned as an India-only product.

Domain/social availability does not by itself establish trademark clearance; professional legal/trademark review remains appropriate.

---

## 3. Long-Term Company Direction

```text
Tokenva
├── Payroll
├── Contractor Payments
├── Treasury
├── Cross-chain Payments
└── Payment API
```

Long-term expansion:

```text
Stablecoin Payroll
↓
Contractor Payments
↓
Cross-chain Payments
↓
Payment API
↓
Webhooks
↓
Accounting Integrations
↓
Vesting
↓
Bonuses
↓
Milestone Payments
↓
Programmable Payment Infrastructure
```

The first product can be described as Tokenva Payroll, but the company/product brand remains Tokenva.

---

## 4. Company Jurisdiction Strategy

**Initial company jurisdiction:** India

**Future jurisdiction options:** Singapore and UAE/Dubai

These are future options, not completed registrations.

The fact that Tokenva initially operates from India while targeting customers in the United States or Singapore does not automatically establish that Tokenva is legally permitted to provide every planned service.

Professional legal advice is required before real customer funds are accepted.

---

## 5. Initial Customer Geography

Initial target customer markets:

- United States
- Singapore

The strategy is international from the beginning.

---

## 6. Initial Customer Profile

Best initial customer:

> A 10–50 person Web3, AI, crypto infrastructure, or remote-first company with globally distributed contractors/employees that is already comfortable using stablecoins.

Potential customer types:

- Web3 startups
- crypto infrastructure startups
- remote-first SaaS startups
- AI startups with global contractors
- DAO tooling companies
- Web3 agencies
- protocol teams
- small fintech startups

Avoid prioritizing initially:

- 500+ employee enterprises
- traditional companies with no crypto/stablecoin familiarity
- companies requiring full EOR/payroll compliance immediately
- companies expecting Tokenva to replace all legal payroll infrastructure on day one

---

## 7. Proposed Operating Model

### Custody

**Non-custodial**

Tokenva should not hold customer funds.

The customer controls its treasury wallet.

```text
Company
   ↓
Customer-controlled treasury wallet
   ↓
Tokenva software/protocol
   ↓
Programmable payment streams
   ↓
Employee / contractor wallet
```

### Tokenva's Role

Tokenva provides:

- payment orchestration
- programmable payment streams
- payment scheduling
- cross-chain workflow coordination
- transaction visibility
- payment status tracking
- reporting
- reconciliation support
- dashboard functionality
- protocol/software infrastructure

### Tokenva Does Not Initially Intend To

Tokenva should not initially:

- custody customer funds
- operate an exchange
- operate as a bank
- issue a stablecoin
- buy crypto for customers
- convert fiat to crypto for customers
- hold customer balances
- withdraw customer funds into a Tokenva-controlled wallet
- automatically assume a money-transfer exemption
- operate a full EOR/payroll provider
- provide fiat banking services

These are product/operating-model intentions, not legal conclusions.

---

## 8. Initial Supported Stablecoins

Initial proposed stablecoin scope:

- USDC
- USDT

The scope may change based on jurisdiction, liquidity, chain support, legal/compliance review, customer demand, and operational risk.

---

## 9. Customer Treasury Model

The customer maintains its own treasury wallet.

```text
Customer
   │
   │ controls private keys
   ▼
Customer Treasury Wallet
   │
   │ funds payment streams
   ▼
Tokenva Protocol / Software
   │
   ├── Payroll streams
   ├── Contractor payments
   ├── Cross-chain workflows
   └── Reporting
```

The objective is to make Tokenva an infrastructure layer rather than a custodian.

---

## 10. Proposed Payment Flow

```text
1. Company creates Tokenva account
        ↓
2. Company configures organization
        ↓
3. Company connects/configures treasury wallet
        ↓
4. Company adds employee/contractor
        ↓
5. Company defines payment terms
        ↓
6. Company funds the payment stream
        ↓
7. Tokenva creates/coordinates programmable payment
        ↓
8. Employee/contractor claims payment
        ↓
9. Blockchain settlement occurs
        ↓
10. Tokenva records transaction/status
        ↓
11. Finance team reconciles payments
```

The exact production workflow remains subject to security, legal, and operational validation.

---

## 11. Current Technical Environment

```text
Solana Devnet
+
EVM Sepolia/Testnet
```

The system is not currently presented as production-ready for unrestricted real customer funds.

---

## 12. Devnet / Testnet Boundary

Development networks are used for:

- internal testing
- protocol testing
- integration testing
- security testing
- cross-chain testing
- dashboard testing
- payment workflow testing
- reconciliation testing
- demonstration
- design-partner preparation

Correct progression:

```text
DEVNET
↓
Internal Testing
↓
Controlled Design-Partner Preparation
↓
Security Review
↓
Legal / Compliance Review
↓
Production Readiness
↓
MAINNET
↓
Controlled Real-Customer Pilot
↓
Scale
```

---

## 13. Mainnet Strategy

Do not rush to Mainnet merely because the protocol technically works.

Before real customer funds are accepted, the project needs:

- legal operating model
- jurisdiction review
- independent security review
- production key-management controls
- infrastructure security review
- monitoring
- incident response
- customer agreements
- privacy documentation
- terms of service
- operational procedures
- support procedures
- reconciliation procedures
- clearly defined product boundaries

A proposed example controlled pilot:

```text
Company
↓
$500–$2,000 initial pilot
↓
5–10 workers
↓
30 days
↓
Observe operational performance
↓
Increase gradually
```

This is an example operating approach, not a mandatory roadmap requirement.

---

## 14. Solana Project

Original technical project:

```text
/projects/stream-pay-solana
```

Toolchain:

```text
Rust:              1.98.1
Cargo:             1.98.1
Solana CLI:        4.1.2
Anchor CLI:        1.2.0
AVM:               1.2.0
cargo-build-sbf:   4.1.0
Platform Tools:    v1.54
```

Project initialization:

```bash
anchor init stream-pay-solana --test-template litesvm
```

Git was initialized.

Anchor build succeeded and Anchor tests were successfully executed during setup.

---

## 15. Solana Program

Current Solana program ID:

```text
4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS
```

Devnet upgrade signature previously recorded:

```text
2ncb936McvpbFt2E4BYeA2qT1e6uV8JSkuEyh63DRc8RiXChP7src2P2ZqSoKNiYGBF1z7tpuoi35gEVgXByVH8K
```

---

## 16. P6 — Security + Legal/Compliance Readiness

The roadmap defines P6 as:

> Security + Legal/Compliance Readiness

The engineering side of P6 has been substantially implemented.

Engineering completion alone does not complete P6.

P6 exit requires technical and non-technical evidence.

---

## 17. P6 Cross-chain Policy Enforcement

Cross-chain actions were wired to the organization policy PDA.

The policy relationship validates that:

- the policy belongs to the organization
- the correct PDA is used
- authorization is enforced
- policy restrictions are applied

Cross-chain top-up also received policy enforcement.

Security tests cover:

- paused policy
- transaction limits
- bypass attempts
- policy/account relationship

Verification:

```bash
cargo test --test cross_chain_security
```

Result:

```text
26 passed
0 failed
```

Full Anchor tests passed.

Full Cargo tests passed.

Devnet upgrade succeeded.

---

## 18. P6 Frontend BFF Security

Architecture:

```text
Browser
   ↓
Next.js server-side route handler / BFF
   ↓
Private server environment
   ↓
Backend API
   ↓
Bearer API key
```

The backend API key must never be exposed through `NEXT_PUBLIC_*`.

Security headers include:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security
Cache-Control: no-store
```

Verification:

```bash
npm run lint
npm run build
```

Both passed.

Direct backend requests without authentication correctly return unauthorized.

BFF verification succeeded for health, operations metrics, and cross-chain message routes.

---

## 19. P6 Cross-chain Status State Machine

Allowed transitions:

```text
created
   ├── submitted
   └── failed

submitted
   ├── source_confirmed
   └── failed

source_confirmed
   ├── message_observed
   └── failed

message_observed
   ├── vaa_available
   └── failed

vaa_available
   ├── destination_submitted
   └── failed

destination_submitted
   ├── destination_confirmed
   └── failed

destination_confirmed
   └── terminal

failed
   └── terminal
```

Invalid transitions are rejected.

The backend reads the current state before allowing a transition.

---

## 20. Backend Transaction Integrity

The `/api/transactions` route was changed from trusting client-provided transaction information to verification-first behavior.

The backend now:

1. validates transaction signature syntax
2. fetches the transaction
3. rejects missing transactions
4. rejects failed transactions
5. verifies that the transaction belongs to the StreamPay/Tokenva program
6. identifies the actual on-chain instruction
7. normalizes the action
8. validates supplied organization claims
9. validates supplied employee claims
10. derives omitted participants from the verified transaction
11. stores verified values
12. records the slot
13. records audit information

Audit records indicate:

```text
verifiedOnChain: true
```

Expected verification failures result in appropriate error responses.

This prevents a client from simply submitting fake organization, employee, action, or signature information and having the backend blindly trust it.

---

## 21. Backend Configuration / Secrets

Backend Solana configuration uses:

```text
SOLANA_RPC_URLS
SOLANA_RPC_URL
```

Default development environment:

```text
Devnet
```

Program ID:

```text
4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS
```

Production EVM owner/key management should move toward:

- multisig
- HSM/institutional key management where appropriate
- key rotation
- least privilege
- approval controls
- break-glass procedures
- monitoring
- auditability

---

## 22. P6 Cross-chain Cancel Lifecycle

A dedicated cross-chain cancellation flow was implemented.

The EVM side includes:

```text
CancelStream
```

The EVM stream has:

```text
canceled
```

Cancellation:

- is owner-authorized
- rejects unknown streams
- rejects already-canceled streams
- marks the stream canceled
- increments the nonce
- publishes the Wormhole cancellation payload

The Solana side validates:

- sequence
- action
- body
- payload hash
- version
- source chain
- destination chain
- destination program
- operation ID
- stream ID
- organization
- employee
- start time
- end time

Native Solana stream fields:

```rust
pub canceled: bool,
pub cancel_time: i64,
```

Tests include:

- double cancellation
- claiming after cancellation
- cancellation while paused

Verification:

```text
anchor build                    passed
cargo test --test cross_chain_security
                                26 passed
cargo test                      passed
npx hardhat test                10 passing
npm run lint                    passed
npm run build                   passed
```

---

## 23. P6 Threat Operations

Security operations documentation:

```text
docs/security/THREAT_OPERATION.md
```

It covers:

- purpose
- security objectives
- protected assets
- trust boundaries
- attacker model
- Solana threats
- cross-chain threats
- EVM gateway threats
- backend threats
- database compromise
- frontend/RPC threats
- key/secret threats
- upgrade authority / owner key compromise
- dependency/deployment threats
- monitoring
- detection
- audit logs
- incident classification
- initial incident procedure
- evidence collection
- cross-chain incident response
- customer-funds incidents
- recovery
- reconciliation
- post-incident review
- residual risks
- production security principles
- P6 threat operations checklist
- P6-F exit evidence

Severity model:

```text
SEV-1
SEV-2
SEV-3
```

The document is not a production security certification.

Before production customer funds:

- independent security review
- production key-management controls
- infrastructure security review
- legal/compliance operating model
- jurisdiction-specific legal review

are still required.

---

## 24. Security Testing Summary

```text
Cross-chain security tests
26 passed
0 failed

Full Solana tests
Passed

EVM Hardhat tests
10 passing

Frontend lint
Passed

Frontend build
Passed

Backend typecheck
Passed
```

The backend does not currently have a real test suite.

Its package script is:

```json
"test": "echo "Error: no test specified" && exit 1"
```

Therefore `npm test` is not meaningful backend verification.

---

## 25. Roadmap Status

```text
M0  Complete
M1  Complete
M2  Complete
M3  Complete
M4  Complete
M5  Complete
M6  Complete
M7  Complete
M8  Complete
M9  Complete
M10 Complete
M11 Complete
M12 Complete

P4 Reliability              Complete
P5 Finance / Accounting    Complete
P6 Security + Legal        Active / completing
P7 Design Partner Pilot    Next
P8 Paid MVP                Future
P9 Scale                   Future
```

---

## 26. P6 Exit Criteria

P6 requires:

### Legal / Operating Model

A defined legal and operating model.

### Independent Security Review

A production-oriented independent security review.

### Key Management

Production-grade key management and ownership controls.

### Infrastructure Security

Production infrastructure security review.

### Customer Documentation

Appropriate customer agreements and policies.

### Jurisdictional Boundaries

Clear understanding of what Tokenva can and cannot offer in target jurisdictions.

---

## 27. Legal / Compliance Review

Professional legal advice is required before accepting real customer funds.

Review should address:

- custody vs non-custody
- money transmission
- payment services
- virtual asset service requirements
- AML/KYC obligations where applicable
- stablecoin regulations
- sanctions considerations
- customer identity requirements
- data/privacy obligations
- tax considerations
- customer agreements
- terms of service
- privacy policy
- jurisdiction-specific restrictions

Tokenva should avoid unnecessarily becoming:

- an exchange
- a stablecoin issuer
- a fiat banking provider
- a custodian

The commercial architecture should remain as simple as the legal model allows.

---

## 28. Initial Legal Operating Model

| Item | Current Position |
|---|---|
| Initial company jurisdiction | India |
| Initial target markets | United States and Singapore |
| Future options | Singapore / UAE |
| Custody model | Non-custodial |
| Treasury | Customer-controlled |
| Initial stablecoins | USDC / USDT |
| Tokenva role | Software / protocol / payment infrastructure |
| Current networks | Solana Devnet + EVM Sepolia/Testnet |

Important:

This is a proposed product and commercial architecture.

It is not:

- legal advice
- regulatory advice
- a licensing determination
- confirmation that Tokenva may legally provide the proposed services in any jurisdiction

Qualified legal counsel must validate the model before production customer funds are accepted.

---

## 29. Customer Responsibilities

The customer is responsible for:

- controlling its treasury wallet
- maintaining its private keys
- funding payment streams
- ensuring it has authority to make payments
- maintaining appropriate employee/contractor information
- complying with applicable laws
- confirming recipients
- managing internal payroll/accounting obligations
- reviewing transaction information
- maintaining treasury controls

---

## 30. Recipient Responsibilities

Employees/contractors are responsible for:

- providing the correct wallet
- protecting their wallet/private keys
- verifying payment details
- claiming payments where required
- managing applicable tax obligations
- reporting incorrect wallet information

---

## 31. Tokenva Security Operating Model

Tokenva should follow:

- least privilege
- non-custody where possible
- server-side secrets
- strong authentication
- transaction verification
- explicit state transitions
- audit logging
- monitoring
- incident response
- secure deployment
- dependency management
- upgrade controls
- key rotation
- emergency procedures

The system should never rely solely on frontend restrictions.

Security-critical authorization must be enforced on the backend and/or blockchain program.

---

## 32. Upgrade Authority / Key Security

Production should use stronger controls than development.

Recommended model:

```text
Development
    ↓
Individual developer authority

Production
    ↓
Multisig / institutional key management
    ↓
Approval workflow
    ↓
Monitoring
    ↓
Audit trail
```

The production system should avoid having a single private key represent the entire security boundary.

---

## 33. P7 — Design Partner Pilot

P7 changes the central question.

P6 asks:

> Does the system have sufficient security, legal, and operational readiness?

P7 asks:

> Will real companies actually use this?

P7 is primarily customer/product validation.

---

## 34. P7 Target

Roadmap target:

```text
3–5 design partners
5–20 workers
small payroll volume
manual onboarding/support
30+ day pilot
```

The objective is to get actual companies through the full workflow.

---

## 35. P7 Real Workflow

```text
Company joins
      ↓
Employees / contractors added
      ↓
Treasury funded
      ↓
Payroll configured
      ↓
Payment streams created
      ↓
Employees claim payments
      ↓
Transactions settle
      ↓
Finance team views records
      ↓
Finance reconciles payments
      ↓
Company repeats workflow
```

---

## 36. P7 What We Need To Measure

Measure:

- setup time
- payroll processing time
- payment failures
- manual work required
- reconciliation effort
- user errors
- employee experience
- finance-team satisfaction
- support requests
- payment reliability
- willingness to continue
- willingness to pay

---

## 37. P7 Exit Criteria

P7 succeeds when real companies have:

- completed the workflow
- used the system repeatedly
- provided feedback
- demonstrated meaningful value
- shown willingness to continue

Strong validation is:

> They actually used it and want to keep using it.

---

## 38. Design Partner Funnel

```text
100 researched
↓
30 qualified
↓
20 contacted
↓
10 conversations
↓
3–5 pilots
```

This is an operating target, not a guaranteed conversion rate.

---

## 39. Ideal First Customer

```text
10–50 person company
        +
Web3 / AI / remote-first
        +
globally distributed contractors
        +
stablecoin comfortable
        +
accessible founder/CTO
```

This minimizes education and maximizes feedback speed.

---

## 40. Founder Outreach Message

**Subject:** Stablecoin payroll for your distributed team

> Hi [Name],
>
> I’m Nitin, founder of Tokenva.
>
> We’re building infrastructure for Web3 and remote-first companies that pay distributed teams internationally using stablecoins.
>
> The problem we’re solving is simple: recurring international payments still require manual wallet management, transfers, tracking and reconciliation.
>
> Tokenva lets companies create programmable payment streams for employees/contractors, with on-chain settlement and cross-chain support.
>
> We’re currently looking for a small number of companies to join an early design-partner pilot.
>
> I’m not asking you to switch your payroll system. I’d simply like to understand how your team currently handles international contractor/payroll payments and see whether Tokenva could remove some of the manual work.
>
> Would you be open to a 20-minute conversation?
>
> Best,
>
> Nitin
>
> Founder — Tokenva
>
> https://tokenva.io
>
> [LinkedIn]

---

## 41. LinkedIn First Message

> Hi [Name] — I’m building Tokenva, infrastructure for Web3/remote companies paying distributed teams internationally with stablecoins.
>
> We’re looking for a few small companies to join an early design-partner pilot.
>
> I’d love to understand how your team currently handles international contractor/payroll payments and whether we could remove some of the manual work.
>
> Would you be open to a quick 20-minute conversation?

---

## 42. Tokenva Website

Project:

```text
/projects/tokenva-web
```

Stack:

```text
Next.js 16.3.8
React 19.2.8
TypeScript
Tailwind CSS v4
App Router
Turbopack
ESLint
Vercel
```

GitHub:

```text
https://github.com/nitindahiya-dev/tokenva-web
```

Vercel:

```text
https://tokenva-web.vercel.app
```

---

## 43. Website Status

Website was created from scratch.

Visual direction:

- black
- minimal
- premium
- fintech/Web3
- responsive

Current pages:

```text
/
 /contact
 /product
 /security
 /technology
```

---

## 44. Website Sections

Homepage contains:

- navigation
- hero
- trust strip
- problem
- product
- capabilities
- how it works
- technology
- security
- design partner pilot
- footer

The site avoids false claims about:

- production readiness
- audits
- regulation
- existing customers
- completed pilots

---

## 45. Website Hero

Headline:

> **Programmable payment infrastructure for global teams.**

Supporting text:

> Tokenva provides programmable payment infrastructure for companies with distributed teams — enabling recurring stablecoin payments, transparent settlement, and cross-chain workflows.

CTA:

> Join the design partner program

Secondary CTA:

> Explore Tokenva

---

## 46. Website Security Positioning

Security section describes Tokenva as being in controlled pilot preparation.

It does not claim:

- completed production audit
- regulatory approval
- production customer funds
- production security certification

Independent review remains required before production customer funds.

---

## 47. Website Metadata

Title:

```text
Tokenva — Programmable Payment Infrastructure
```

Description:

```text
Tokenva provides programmable payment infrastructure for companies with globally distributed teams.
```

Keywords:

```text
Tokenva
stablecoin payments
global payments
programmable payments
cross-chain payments
Web3 payroll
```

OpenGraph branding is configured.

---

## 48. Website Contact Page

Target audiences:

- Web3/crypto-native companies
- AI startups
- remote-first startups
- globally distributed teams
- stablecoin-comfortable teams
- early feedback participants

Target contact:

```text
hello@tokenva.io
```

Professional email will be activated after domain setup.

---

## 49. Website Verification

```bash
npm run lint && npm run build
```

Passed.

Build routes:

```text
/
_not-found
/contact
/product
/security
/technology
```

---

## 50. Website Git History

Initial commit:

```text
a56a4e0 build Tokenva landing page
```

Second commit:

```text
1344af1 add Tokenva product pages
```

Changes were pushed to GitHub.

---

## 51. Website Deployment

The website GitHub repository is connected to Vercel.

Automatic deployments are enabled.

Deployment protection exists for the project, while a production alias exists.

---

## 52. Previous Technical Architecture

Original system:

```text
Solana Program
        ↓
Cross-chain messaging
        ↓
EVM Gateway
        ↓
Backend API
        ↓
Database
        ↓
Next.js Web Dashboard
```

The architecture is being repositioned under Tokenva.

---

## 53. Cross-chain Architecture

Conceptually:

```text
Solana
  ↓
Cross-chain message
  ↓
Wormhole
  ↓
EVM Gateway
  ↓
Destination workflow
```

Security controls include:

- sequence validation
- payload validation
- action validation
- chain validation
- destination program validation
- operation ID validation
- stream ID validation
- organization validation
- employee validation
- state transition validation
- transaction verification

---

## 54. EVM Gateway

The EVM gateway is a high-risk security boundary because compromise can affect cross-chain actions.

Production controls should include:

- strong owner controls
- multisig
- monitoring
- transaction limits
- emergency response
- key rotation
- independent security review

---

## 55. Backend Security Boundary

The backend must not blindly trust:

```text
client-supplied transaction signature
client-supplied organization
client-supplied employee
client-supplied action
```

Preferred flow:

```text
Client
   ↓
Backend
   ↓
Blockchain verification
   ↓
Verified transaction
   ↓
Database
```

---

## 56. Database Security Principle

The database is not the ultimate source of truth for blockchain transaction authenticity.

Blockchain verification establishes transaction authenticity.

The database provides:

- indexed records
- application state
- reporting
- operational data
- reconciliation information

---

## 57. Frontend Security Principle

Frontend restrictions are not sufficient security.

Preferred architecture:

```text
Frontend validation
        +
Backend validation
        +
On-chain authorization
```

Critical authorization must be enforced outside the browser.

---

## 58. Threat Model

### Solana

- unauthorized instruction execution
- PDA/account substitution
- organization policy bypass
- stream manipulation
- replay
- invalid state transitions
- unauthorized cancellation
- unauthorized claims

### Cross-chain

- forged message
- replayed message
- incorrect destination
- wrong source chain
- wrong destination chain
- wrong program
- payload manipulation
- sequence abuse
- stale message
- duplicate execution

### EVM

- owner key compromise
- unauthorized stream operations
- cancellation abuse
- replay
- message verification failures
- gateway compromise

### Backend

- API key compromise
- authorization bypass
- transaction spoofing
- database tampering
- log manipulation
- SSRF
- injection
- credential leakage

### Frontend

- XSS
- exposed secrets
- malicious RPC
- phishing
- client-side manipulation

### Infrastructure

- compromised deployment environment
- malicious dependency
- CI/CD compromise
- secret leakage
- server compromise

---

## 59. Incident Severity

### SEV-1

Critical security incident involving:

- customer funds
- active exploit
- major private key compromise
- protocol compromise
- widespread unauthorized transactions

### SEV-2

Serious security issue that does not currently cause widespread loss but requires urgent containment.

### SEV-3

Limited or low-impact issue.

---

## 60. Incident Response

```text
Detect
  ↓
Classify
  ↓
Contain
  ↓
Preserve evidence
  ↓
Investigate
  ↓
Recover
  ↓
Reconcile
  ↓
Communicate
  ↓
Post-incident review
```

For customer-funds incidents:

1. stop affected operations where possible
2. protect remaining assets
3. preserve logs
4. identify affected wallets/accounts
5. identify compromised keys
6. coordinate with security/legal teams
7. determine customer impact
8. reconcile transactions
9. document the incident
10. perform root-cause analysis
11. implement corrective controls

---

## 61. Monitoring

Production monitoring should cover:

- failed transactions
- unusual transaction volume
- unusual wallet activity
- cross-chain message failures
- repeated retries
- invalid message attempts
- state transition failures
- authentication failures
- API abuse
- infrastructure failures
- key usage
- owner/admin operations
- deployment activity

---

## 62. Audit Logging

Important operations should be auditable.

Audit events should identify, where applicable:

- actor
- action
- timestamp
- organization
- transaction signature
- blockchain slot
- request identifier
- result
- security-relevant metadata

Logs should be protected from unauthorized modification.

---

## 63. P6 Operating Model Document

Recommended file:

```text
docs/legal/TOKENVA_OPERATING_MODEL.md
```

It should document:

- company jurisdiction
- customer geography
- custody model
- treasury model
- stablecoin scope
- Tokenva's role
- excluded activities
- customer responsibilities
- recipient responsibilities
- legal review requirements
- pilot model
- production gate
- jurisdictional boundaries
- P6 exit requirements
- P7 entry criteria
- assumptions
- open decisions
- disclaimers

---

## 64. Customer Contract Documentation

Before production:

- Terms of Service
- Privacy Policy
- customer agreement
- design partner agreement
- acceptable use policy
- risk disclosures
- payment/transaction terms
- support policy
- incident communication procedures

Exact documents depend on legal advice.

---

## 65. Restricted Use / Risk Controls

Potential controls:

- prohibited jurisdictions
- prohibited customers
- sanctioned parties
- suspicious activity
- unusual transaction behavior
- unsupported assets
- unsupported chains
- unusually large payments
- high-risk addresses

Exact compliance controls should be designed with legal/compliance counsel.

---

## 66. Customer Onboarding

Initial design-partner onboarding should remain manual.

```text
Founder/finance contact
        ↓
Qualification call
        ↓
Business/use-case review
        ↓
Technical onboarding
        ↓
Wallet setup
        ↓
Small controlled payment
        ↓
First payroll cycle
        ↓
Support
        ↓
Feedback
```

Manual onboarding is acceptable during P7.

Automation can be added after workflow validation.

---

## 67. P7 Support Model

Early pilots should have direct founder/engineering support.

The goal is to discover:

- confusing UX
- failed transactions
- operational gaps
- reconciliation issues
- missing features
- customer objections

Every support problem should be treated as product feedback.

---

## 68. Product Validation Questions

Ask prospective customers:

1. How do you currently pay international contractors?
2. How many contractors are outside your home country?
3. Which currencies/assets do you use?
4. How often do you make payments?
5. How much manual work is involved?
6. Who manages wallets?
7. How do you reconcile payments?
8. What happens when a payment fails?
9. What do employees/contractors complain about?
10. Would programmable payments reduce manual work?
11. Would you trust a non-custodial system?
12. What would prevent you from using it?
13. Would you pay for it?
14. What pricing model would make sense?

---

## 69. Product Validation Principle

Do not optimize only for technical complexity.

Optimize for:

```text
Customer problem
      ↓
Simple workflow
      ↓
Reliable execution
      ↓
Clear financial records
      ↓
Low manual work
      ↓
Customer retention
```

The goal is not to build the most complicated Web3 system.

The goal is to solve a valuable payment problem reliably.

---

## 70. P7 Metrics

Suggested measurements:

```text
Time to first payment
Payment success rate
Payment failure rate
Manual intervention count
Reconciliation time
Support requests
Setup time
Employee satisfaction
Finance satisfaction
Repeat usage
Retention
Willingness to pay
```

---

## 71. P8 — Paid MVP

After P7 validates actual demand:

```text
P7 Design Partner Pilot
        ↓
Validated workflow
        ↓
P8 Paid MVP
```

P8 focuses on:

- pricing
- paid customers
- retention
- repeat usage
- improving onboarding
- reducing manual support
- production hardening

Do not optimize pricing before demonstrating meaningful value.

---

## 72. P9 — Scale

Scale comes after:

- repeatable customer acquisition
- reliable payments
- stable infrastructure
- validated pricing
- legal readiness
- security readiness
- operational maturity

Do not scale an unvalidated product.

---

## 73. Product Boundary Principle

Keep Tokenva's commercial architecture as simple as the legal model allows.

Preferred architecture:

```text
Customer owns funds
        ↓
Customer authorizes payments
        ↓
Tokenva coordinates programmable execution
        ↓
Blockchain settles
        ↓
Tokenva provides visibility and reconciliation
```

---

## 74. Why Non-custodial Is Preferred

Non-custodial architecture can reduce certain operational and regulatory complexity and aligns with the product positioning:

> Infrastructure rather than financial custody.

However:

> **Non-custodial does not automatically mean unregulated.**

Legal counsel must determine the actual regulatory position.

---

## 75. Current Product Narrative

> Tokenva provides programmable payment infrastructure for companies with globally distributed teams. Companies can use stablecoins to create recurring payment workflows, coordinate cross-chain settlement, and maintain transparent payment records without requiring Tokenva to custody their treasury.

This remains subject to legal review.

---

## 76. Current Technical Narrative

> Tokenva combines a Solana-based payment protocol, cross-chain messaging, an EVM gateway, backend transaction verification, and a Next.js dashboard to coordinate programmable stablecoin payment workflows.

---

## 77. Current Security Narrative

> Tokenva is designed around non-custodial architecture, on-chain authorization, explicit cross-chain state transitions, transaction verification, server-side secrets, audit logging, and operational controls. Independent security review and production key-management controls remain required before real customer funds are accepted.

---

## 78. What Has Already Been Proven Technically

The project has demonstrated:

- Solana program compilation
- Solana tests
- Anchor tests
- cross-chain security tests
- policy enforcement
- transaction verification
- state-machine enforcement
- cross-chain cancellation
- EVM gateway behavior
- backend type checking
- frontend linting
- frontend production build
- Devnet deployment/upgrade
- EVM Sepolia/Testnet workflows
- BFF routing
- security headers

---

## 79. What Has NOT Yet Been Proven

The project has not yet proven:

- production legal eligibility
- production regulatory compliance
- production security certification
- independent audit completion
- real customer retention
- willingness to pay
- scalable customer acquisition
- production operational maturity
- production support maturity
- production Mainnet safety
- jurisdictional approval

These must not be claimed on the website or in sales materials as completed facts.

---

## 80. Current Biggest Gap

The biggest gap is no longer simply:

> “Can we build it?”

The project now needs to answer:

> “Can a real international company safely and legally use this, and does it solve enough pain that they will continue paying for it?”

This is the transition from engineering to product/company validation.

---

## 81. Immediate Priority Order

```text
1. Finalize Tokenva operating model
        ↓
2. Legal/compliance consultation
        ↓
3. Independent security review planning
        ↓
4. Production security/key-management planning
        ↓
5. Finish P6 evidence
        ↓
6. Prepare controlled pilot environment
        ↓
7. Recruit 3–5 design partners
        ↓
8. Run 30+ day pilots
        ↓
9. Measure results
        ↓
10. Improve product
        ↓
11. Validate willingness to pay
        ↓
12. P8 Paid MVP
```

---

## 82. Immediate Business Work

- purchase `tokenva.io`
- configure professional email
- finalize LinkedIn company presence
- finalize X presence
- prepare founder profile
- identify target companies
- research decision makers
- begin outreach
- conduct discovery calls
- recruit design partners

---

## 83. Immediate Technical Work

Focus on:

- controlled pilot readiness
- deployment reproducibility
- monitoring
- production configuration
- operational runbooks
- reconciliation
- failure handling
- security review preparation
- test coverage where gaps exist
- documentation
- customer onboarding workflow

---

## 84. Production Readiness Gate

```text
LEGAL
[ ] Legal operating model defined
[ ] Target jurisdictions reviewed
[ ] Customer agreements reviewed
[ ] Privacy requirements reviewed
[ ] Stablecoin/payment model reviewed
[ ] Custody position confirmed

SECURITY
[ ] Independent security review
[ ] Solana program review
[ ] EVM gateway review
[ ] Backend review
[ ] Frontend/BFF review
[ ] Infrastructure review
[ ] Key management review
[ ] Incident response tested

OPERATIONS
[ ] Monitoring
[ ] Alerting
[ ] Incident response
[ ] Reconciliation
[ ] Support workflow
[ ] Backup/recovery
[ ] Deployment procedure
[ ] Rollback procedure

PRODUCT
[ ] Customer onboarding
[ ] Treasury setup
[ ] Payment creation
[ ] Claim workflow
[ ] Cancellation
[ ] Reporting
[ ] Reconciliation
[ ] Error handling
```

Only after these areas are sufficiently addressed should production customer funds be considered.

---

## 85. Design Partner Entry Gate

```text
[ ] Target customer identified
[ ] Use case validated
[ ] Pilot scope defined
[ ] Number of workers defined
[ ] Payment amount defined
[ ] Support process defined
[ ] Risk boundaries defined
[ ] Feedback process defined
[ ] Metrics defined
```

Real customer funds should remain blocked until the production gate is satisfied.

---

## 86. Assumptions

1. Tokenva begins from India.
2. Initial customers are targeted in the United States and Singapore.
3. Tokenva prefers a non-custodial architecture.
4. Customer treasury remains customer-controlled.
5. Initial stablecoins are USDC and USDT.
6. Tokenva is primarily software/payment infrastructure.
7. Tokenva does not initially operate an exchange.
8. Tokenva does not initially provide fiat banking.
9. Tokenva does not initially issue stablecoins.
10. Tokenva does not initially custody customer assets.
11. Professional legal review is required.
12. Independent security review is required.
13. Production customer funds are not accepted until the production gate is satisfied.

---

## 87. Open Decisions / TBD

Still to determine:

- exact legal entity structure
- exact Indian regulatory analysis
- exact US customer restrictions
- exact Singapore customer restrictions
- future Singapore/UAE entity structure
- supported production chains
- exact stablecoin support
- pricing
- customer agreement structure
- compliance onboarding requirements
- production custody boundaries
- tax handling
- accounting integrations
- payment limits
- risk scoring
- sanctions screening approach
- support SLAs

These should not be guessed.

---

## 88. Rule for Future StreamPay/Tokenva Engineering

> **Never assume, invent, or modify any file/code/configuration without first reviewing the exact current file/code/configuration.**

When a technical change is required:

```text
1. Identify exact file(s)
        ↓
2. Ask user for current contents if not already provided
        ↓
3. Review current implementation
        ↓
4. Propose focused change
        ↓
5. User applies/approves change
        ↓
6. Verify
```

Do not rewrite unrelated code.

Do not invent project structure.

Do not assume a file's current contents.

Do not silently replace existing architecture.

---

## 89. Verification Philosophy

Preferred pattern:

```text
Change
  ↓
Targeted test
  ↓
Relevant build/typecheck
  ↓
Full suite when appropriate
  ↓
Deployment verification
```

Avoid unnecessary repeated tests when the same result has already been established.

---

## 90. Current Project State — One View

```text
                    TOKENVA
                       │
          Programmable payment infrastructure
                       │
        ┌──────────────┴──────────────┐
        │                             │
   PRODUCT                      COMPANY
        │                             │
Stablecoin payroll              India initially
Contractor payments             US/Singapore target
Cross-chain payments            Singapore/UAE future
Treasury infrastructure         Non-custodial
Payment API
        │
        ▼
TECHNICAL SYSTEM
        │
 ┌──────┼────────┐
 │      │        │
Solana  Wormhole EVM
 │      │        │
 └──────┼────────┘
        │
     Backend
        │
     Database
        │
     Next.js
        │
     Dashboard
```

---

## 91. Current Roadmap Position

The project is transitioning from:

```text
Engineering Build
```

to:

```text
Security + Legal Readiness
```

and then:

```text
Design Partner Validation
```

Strategic transition:

```text
M0–M12
Technical Foundation
        ↓
P4
Reliability
        ↓
P5
Finance / Accounting
        ↓
P6
Security + Legal
        ↓
P7
Design Partners
        ↓
P8
Paid MVP
        ↓
P9
Scale
```

---

## 92. Final Product Direction

Tokenva should ultimately become:

> **Programmable payment infrastructure for global teams.**

First practical use case:

> **Stablecoin payroll and contractor payments for Web3, AI, and remote-first companies.**

Long-term platform:

- programmable payments
- payroll
- contractor payments
- treasury workflows
- cross-chain payments
- APIs
- webhooks
- accounting
- vesting
- bonuses
- milestone payments

---

## 93. Final Operating Model

```text
TOKENVA
   │
   │ Software / Protocol / Payment Infrastructure
   │
   ▼
CUSTOMER
   │
   │ Controls Treasury
   ▼
CUSTOMER WALLET
   │
   │ Stablecoins
   ▼
PROGRAMMABLE PAYMENT STREAM
   │
   ├───────────────┐
   │               │
   ▼               ▼
EMPLOYEE       CONTRACTOR
   │               │
   └───────┬───────┘
           ▼
      BLOCKCHAIN
           │
           ▼
      SETTLEMENT
           │
           ▼
      TOKENVA DASHBOARD
           │
           ▼
      REPORTING / RECONCILIATION
```

Intended boundary:

> **Customer controls funds. Tokenva provides infrastructure that coordinates programmable payment execution and visibility.**

---

## 94. Current P6 Status

P6 is:

> **Engineering substantially implemented; legal/operating and independent production-readiness work still required.**

Technical security work already completed should be preserved.

Remaining P6 work:

- legal review
- operating-model confirmation
- independent security review
- production infrastructure
- production key management
- operational controls
- documentation
- jurisdictional boundaries

---

## 95. P6 → P7 Transition

```text
P6
Security + Legal Readiness
        │
        ├── Legal model
        ├── Security review
        ├── Key management
        ├── Infrastructure
        ├── Documentation
        │
        ▼
P7
Design Partner Pilot
        │
        ├── 3–5 companies
        ├── 5–20 workers
        ├── small payment volume
        ├── manual onboarding
        ├── 30+ days
        └── real feedback
        │
        ▼
P8
Paid MVP
```

---

## 96. Final Strategic Principle

The project should not continue adding complexity simply because more technology can be added.

Priority:

```text
Security
+
Legal clarity
+
Real customers
+
Reliable payments
+
Reconciliation
+
Customer value
```

The next major milestone is not another large technical feature.

It is proving that a real company can use Tokenva safely, understand it, receive value from it, and want to continue using it.

---

## 97. Document Status

**Project:** Tokenva  
**Former technical/project name:** StreamPay  
**Phase:** P6 → P7 transition  
**Initial company jurisdiction:** India  
**Initial customer geography:** United States / Singapore  
**Future jurisdiction options:** Singapore / UAE  
**Custody model:** Proposed non-custodial  
**Initial stablecoins:** USDC / USDT  
**Current networks:** Solana Devnet + EVM Sepolia/Testnet  
**Production customer funds:** Not yet enabled  
**Independent security review:** Required  
**Legal review:** Required  
**Design partner pilot:** Next major business phase

---

## 98. Important Disclaimer

This document describes the current proposed product, technical, commercial, and operating direction for Tokenva.

It is not legal advice.

It is not a regulatory determination.

It does not establish that Tokenva is licensed, registered, exempt, authorized, or otherwise legally permitted to provide the proposed services in India, the United States, Singapore, the UAE, or any other jurisdiction.

Before accepting real customer funds or launching production payment services, Tokenva should obtain appropriate professional legal and compliance advice and complete the required security and operational readiness work.

---

## 99. Next Phase

```text
TOKENVA
   ↓
Finalize operating model
   ↓
Legal consultation
   ↓
Independent security review preparation
   ↓
Production readiness
   ↓
Design partner recruitment
   ↓
Controlled pilot
   ↓
Measure actual usage
   ↓
Validate willingness to pay
   ↓
Paid MVP
   ↓
Scale
```

**The technical foundation exists. The next challenge is turning that foundation into a legally defensible, secure, usable, and commercially valuable product.**
