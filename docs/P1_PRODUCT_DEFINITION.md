# Tokenva — P1 Product Definition + Customer Discovery

**Status:** Active  
**Product direction:** Programmable stablecoin payroll for global crypto-native teams

---

## 1. Problem statement

**Working hypothesis:** Crypto-native global companies with international employees/contractors may face recurring payroll that is manual, fragmented, difficult to reconcile, and difficult to automate across wallets/chains.

Validate:

- current payroll workflow
- payment failures/delays
- manual work
- reconciliation effort
- treasury/funding problems
- cross-chain complexity
- need for programmable/recurring compensation

This remains a hypothesis until customer evidence validates it.

---

## 2. Target customer

Initial focus:

- crypto-native companies
- international employees/contractors
- recurring compensation
- stablecoin usage
- remote/distributed teams
- founder/finance/treasury/operations owner of payroll

Target approximately **20–30 interviews** before major product expansion.

---

## 3. Buyer / personas

Primary:

- Founder
- COO
- CFO / Finance Lead
- Treasury Lead
- Operations Lead

Secondary user:

- Employee / Contractor

Validate who owns the problem and who makes the buying decision.

---

## 4. Current payroll workflow

Understand the customer's real process:

```text
Payroll preparation
      ↓
Recipient / wallet verification
      ↓
Approval
      ↓
Treasury funding
      ↓
Payment execution
      ↓
Confirmation
      ↓
Failure handling
      ↓
Reconciliation / reporting
```

Do not assume every customer follows this exact workflow.

Record:

- tools used
- people involved
- processing time
- payment frequency
- assets/chains used
- manual steps

---

## 5. Pain points to validate

Measure:

- manual payroll work
- payment failures/delays
- reconciliation effort
- treasury visibility/funding
- cross-chain operations
- payment-status visibility
- recurring-payment automation
- continuous/time-based compensation

For each major pain, record:

**frequency + severity + time cost + existing workaround + existing spend + willingness to pay**

---

## 6. Tokenva value proposition

**Working proposition:**

> Tokenva aims to make recurring stablecoin payroll programmable, trackable, and easier to operate for global crypto-native teams.

Potential value:

- recurring payment automation
- programmable compensation
- treasury/payroll coordination
- payment visibility
- reconciliation support
- cross-chain support where customers actually need it

The technology is the implementation; the customer value is the payroll problem being solved.

---

## 7. MVP hypothesis

Initial MVP should focus on:

- company payroll setup
- employee/contractor wallet management
- stablecoin payroll
- recurring payment streams
- treasury funding
- payment status
- basic reconciliation

Do not build these broadly until customer discovery shows they matter.

---

## 8. Non-MVP scope

Defer:

- broad multi-chain expansion
- advanced enterprise permissions
- large accounting integrations
- complex payroll administration
- exchange/fiat-banking functionality
- stablecoin issuance
- unnecessary custody features

Do not lead with:

- Wormhole
- NTT
- Solana internals
- EVM gateway
- VAA infrastructure

Known prototype limitation:

```text
NTT transfer
   ↓
Destination wallet
   ↓
Manual Tokenva vault deposit
```

No automated atomic NTT-receive-to-vault relayer is claimed.

---

## 9. Customer interview script

### Current workflow

1. Walk me through your last payroll cycle.
2. Who prepares, approves, and sends payments?
3. Which wallets, chains, assets, and tools are involved?
4. How long does it take?

### Problems

5. What usually goes wrong?
6. Tell me about the last failed/delayed payment.
7. How much manual reconciliation is required?
8. What is the most painful part?

### Automation

9. What would you most like to automate?
10. Would recurring or continuous compensation solve a real problem?

### Buying

11. What do you use today?
12. What does it cost?
13. What would make you switch?
14. Who decides whether to buy?
15. Would you consider paying for a better solution?

Ask for real recent examples and record negative feedback.

---

## 10. Validation metrics

Track:

- interview count
- customer segment/persona
- recurring pain frequency
- pain severity
- time/operational cost
- existing workaround
- existing spend
- buying signals
- objections
- design-partner interest

Strong buying evidence includes:

- request for a pilot
- request for product evaluation
- introduction to decision-maker
- discussion of budget
- willingness to pay

---

## 11. P1 exit criteria

P1 is complete when we have:

### Repeatable pain

Evidence that a meaningful payroll problem occurs repeatedly across relevant customers.

### Clear early customer

A specific customer profile and buyer/persona are identified.

### Buying reason

Evidence that customers would consider paying to solve the validated problem.

### Decision

```text
CONTINUE → move to P2
NARROW   → refine customer/use case
STOP/PIVOT → change direction
```

---

## P1 outcome

P1 must produce a validated:

```text
Customer
   ↓
Problem
   ↓
Current workflow
   ↓
Pain
   ↓
Value proposition
   ↓
Buyer
   ↓
Buying evidence
   ↓
Focused P2 scope
```

No major product expansion before this evidence exists.
