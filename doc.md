# StreamPay Solana — Learning Notes

# 1. WHAT ARE WE BUILDING?

StreamPay is a payroll/payment streaming protocol.

The basic idea:

```text
Company
   ↓
deposits tokens
   ↓
StreamPay Vault
   ↓
creates a payment Stream
   ↓
employee earns money over time
   ↓
employee claims earned money
```

Example:

```text
Company wants to pay 3,000 USDC over 30 days
```

Instead of:

```text
Day 1 → employee gets all 3,000 USDC
```

we want:

```text
Day 1  → small amount becomes earned
Day 2  → more becomes earned
...
Day 30 → full amount is earned
```

---

# 2. CORE SOLANA WORDS

```text
Program
[Rules that our Solana application follows]

Account
[Data stored on Solana]

Instruction
[An action that our Program can perform]

Transaction
[A request sent to Solana to perform one or more Instructions]

Wallet
[User/company identity used to control funds and sign Transactions]

Signer
[The Wallet that approves/signs a Transaction]

PDA
[A special program-derived address used by the Program]

CPI
[Our Program calling another Solana Program]

Token
[Digital value such as USDC]

Mint
[Defines a particular Token]

Token Account
[Account that holds the balance of a particular Token]

Token Program
[Solana Program that manages Token operations]

Transfer
[Move Tokens from one Token Account to another]

Vault
[The Token Account where our protocol keeps funds]

Stream
[The agreement describing how money is paid over time]
```

---

# 3. THE GENERAL SOLANA FLOW

```text
Wallet
[User/company identity that approves the action]
        ↓
Transaction
[Request sent to Solana]
        ↓
Instruction
[Specific action we want to perform]
        ↓
Program
[Our StreamPay rules execute]
        ↓
Accounts
[Program reads or changes on-chain data]
```

## In our project

```text
Company Wallet
[Company controls this Wallet]
        ↓
signs Transaction
[Company approves the action]
        ↓
Deposit Instruction
[Company asks StreamPay to deposit tokens]
        ↓
StreamPay Program
[Our Rust program checks the rules]
        ↓
CPI
[StreamPay asks the Token Program to move tokens]
        ↓
Vault Token Account
[Vault balance changes]
```

---

# 4. WHAT OUR PROGRAM DOES

Our StreamPay Program contains the rules.

## Instructions built so far

```text
initialize_protocol
[Create the protocol configuration]

create_organization
[Create a company/organization record]

initialize_vault
[Create a company-specific token vault]

deposit
[Move tokens into the company vault]

create_stream
[Create a payment stream and reserve its funds]

claim
[Allow the employee to claim earned Tokens]
```

## Future instructions

```text
cancel_stream
top_up_stream
pause_protocol
```

---

# 5. M1 — PROTOCOL CONFIGURATION

## STATUS: COMPLETE ✅

## Goal

Create the basic configuration of StreamPay.

## What did we create?

```text
ProtocolConfig PDA
[On-chain account that stores StreamPay protocol metadata]
```

It stores:

```text
authority
[Who controls the protocol]

version
[Protocol version]

paused
[Whether protocol activity is paused]

bump
[PDA bump used during address derivation]

created_at
[Protocol creation timestamp]
```

---

# 6. M1 — INITIALIZE PROTOCOL FLOW

```text
Authority Wallet
[Wallet allowed to initialize the protocol]
        ↓
signs Transaction
[Approves creation of protocol configuration]
        ↓
initialize_protocol Instruction
[Action that creates ProtocolConfig]
        ↓
StreamPay Program
[Creates and initializes the PDA]
        ↓
ProtocolConfig PDA
[Stores protocol metadata]
```

In simple words:

```text
Authority says:
"Create StreamPay's configuration."

Program:
"Okay. I will create the ProtocolConfig account
and store the protocol settings."
```

---

# 7. M1 — WHY DO WE USE A PDA?

We need a predictable address for the protocol configuration.

We use:

```text
"protocol"
```

as the seed.

Conceptually:

```text
StreamPay Program ID
        +
"protocol"
        ↓
ProtocolConfig PDA
```

So:

```text
PDA
[Predictable program-derived address]

ProtocolConfig PDA
[The specific address where protocol settings live]
```

---

# 8. M1 — CODE STRUCTURE

```text
state.rs
[Defines the ProtocolConfig data]

constants.rs
[Defines the protocol PDA seed and version]

initialize_protocol.rs
[Contains protocol initialization logic]

lib.rs
[Exposes initialize_protocol]

tests/protocol_config.rs
[Tests the real instruction]
```

---

# 9. M1 — TEST

## Why do we test?

We don't only want:

```text
"Rust compiled"
```

We want:

```text
"The actual Solana instruction executed correctly."
```

## Test flow

```text
Create test environment
        ↓
Load StreamPay Program
        ↓
Create test Wallet
        ↓
Call initialize_protocol
        ↓
Program creates ProtocolConfig PDA
        ↓
Read ProtocolConfig
        ↓
Check stored values
```

## Verified

```text
✅ ProtocolConfig PDA created
✅ Authority correct
✅ Version = 1
✅ Paused = false
✅ PDA bump correct
✅ Created timestamp stored
```

## Result

```text
1 test passed
0 failed

M1 = COMPLETE ✅
```

---

# 10. M2 — TOKEN VAULT

## STATUS: COMPLETE ✅

## Goal

Create a place where StreamPay can hold Tokens.

The idea:

```text
Company
   ↓
Company Token Account
   ↓
deposit
   ↓
StreamPay Company Vault
   ↓
holds USDC
```

---

# 11. IMPORTANT M2 PARTS

## Mint

```text
Mint
[Defines the Token]
```

Example:

```text
USDC Mint
[Defines what the USDC token is]
```

## Token Account

```text
Token Account
[Holds the actual Token balance]
```

Examples:

```text
Company Token Account
[Holds company's USDC]

Vault Token Account
[Holds StreamPay's USDC]
```

## Vault Authority PDA

```text
Vault Authority PDA
[PDA used as the authority for the Vault]
```

So:

```text
Mint
  ↓
defines the Token

Token Account
  ↓
holds Token balance

Vault Token Account
  ↓
holds StreamPay funds

Vault Authority PDA
  ↓
controls the Vault
```

---

# 12. M2.1 — CREATE THE COMPANY VAULT

## Goal

Create a Vault Token Account for a specific company and Token.

## Why?

A global vault would make different companies share the same Token Account.

We instead want:

```text
Company A + USDC
        ↓
Company A Vault

Company B + USDC
        ↓
Company B Vault
```

## Vault PDA

The Vault PDA is derived from:

```text
"vault"
+
Organization PDA
+
Mint
```

Conceptually:

```text
VAULT_SEED
   +
Organization
   +
Mint
   ↓
Company-specific Vault PDA
```

## Vault Authority PDA

Derived from:

```text
"vault-authority"
+
Organization PDA
+
Mint
```

Conceptually:

```text
VAULT_AUTHORITY_SEED
   +
Organization
   +
Mint
   ↓
Vault Authority PDA
```

---

# 13. M2.1 — CREATE VAULT FLOW

```text
Company Wallet
[Company's signing wallet]
        ↓
signs Transaction
[Approves vault creation]
        ↓
initialize_vault Instruction
[Requests creation of the vault]
        ↓
StreamPay Program
[Checks Organization, Mint and PDA accounts]
        ↓
Token Program
[Creates the Token Account]
        ↓
Vault Token Account
[Stores the company's future Token balance]
```

Initially:

```text
Vault balance = 0
```

---

# 14. M2.1 — TEST

## Test flow

```text
Create test company Wallet
        ↓
Create test Mint
        ↓
Create Organization
        ↓
Call initialize_vault
        ↓
Vault Token Account created
        ↓
Check Mint
        ↓
Check Vault Authority
        ↓
Check Balance
```

## Verified

```text
✅ Mint exists
✅ Vault created
✅ Vault is a Token Account
✅ Vault uses correct Mint
✅ Vault authority is correct PDA
✅ Initial balance = 0
```

Result:

```text
M2.1 = COMPLETE ✅
```

---

# 15. M2.2 — DEPOSIT TOKENS

Now the Vault exists.

Next we move Tokens into it.

Example:

```text
Company has:

3,000 USDC
```

Company deposits:

```text
1,000 USDC
```

Before:

```text
Company Token Account = 3,000 USDC
Vault                 = 0 USDC
```

After:

```text
Company Token Account = 2,000 USDC
Vault                 = 1,000 USDC
```

---

# 16. M2.2 — DEPOSIT FLOW

```text
Company Wallet
[Company identity and signing Wallet]
        ↓
signs Transaction
[Company approves the deposit]
        ↓
deposit Instruction
[Asks StreamPay to deposit Tokens]
        ↓
StreamPay Program
[Checks Organization, source account, Mint and Vault]
        ↓
CPI
[StreamPay asks the Token Program to transfer Tokens]
        ↓
Token Program
[Actually moves the Tokens]
        ↓
Vault Token Account
[Receives and stores the USDC]
```

---

# 17. M2.2 — WHY DO WE USE CPI?

StreamPay does not directly implement the Token transfer.

The Token Program manages Token operations.

So:

```text
StreamPay
   ↓
"I want to transfer these Tokens"
   ↓
CPI
   ↓
Token Program
   ↓
"Okay, I will perform the transfer"
```

Therefore:

```text
CPI
[Our Program calls another Program]
```

In our case:

```text
StreamPay
   ↓ CPI
Token Program
```

---

# 18. M2.2 — WHAT DOES DEPOSIT CHECK?

The Program checks:

```text
depositor
[The person depositing signed the transaction]

depositor Token Account
[The source account belongs to the depositor]

Organization
[The depositor is the authority of that Organization]

Mint
[The source Token Account uses the expected Token]

Vault
[The destination is the correct company-specific vault]

amount
[Must be greater than zero]
```

---

# 19. M2.2 — ACTUAL TOKEN MOVEMENT

```text
Company Token Account
[Contains 3,000 USDC]
        ↓
Transfer
[Move 1,000 USDC]
        ↓
Token Program
[Performs the transfer]
        ↓
Vault Token Account
[Now contains 1,000 USDC]
```

After:

```text
Company Token Account = 2,000 USDC
Vault Token Account   = 1,000 USDC
```

---

# 20. M2.2 — SECURITY TEST

We added:

```text
amount must be greater than zero
```

Therefore:

```text
deposit(1,000)
        ↓
✅ allowed

deposit(0)
        ↓
❌ rejected
```

Why?

```text
Invalid or meaningless state changes should be rejected.
```

---

# 21. M2.2 — TEST

## Test flow

```text
Create test company
        ↓
Create Mint
        ↓
Create Company Token Account
        ↓
Mint 3,000 test Tokens
        ↓
Create Organization
        ↓
Create Company Vault
        ↓
deposit(1,000)
        ↓
Read both Token Accounts
        ↓
Check balances
```

## Verified

```text
✅ Token transfer worked
✅ Company balance decreased correctly
✅ Vault balance increased correctly
✅ CPI to Token Program worked
✅ Zero deposit rejected
```

Result:

```text
M2.2 = COMPLETE ✅
```

---

# 22. M3 — COMPANY / ORGANIZATION

## STATUS: COMPLETE ✅

## Goal

Create a record representing a company.

We need StreamPay to know:

```text
"Which company owns this payment activity?"
```

---

# 23. M3.1 — ORGANIZATION ACCOUNT

## What is it?

```text
Organization PDA
[On-chain record representing the company]
```

It stores:

```text
authority
[Company Wallet that controls it]

bump
[PDA bump]

created_at
[Creation timestamp]
```

---

# 24. M3.1 — ORGANIZATION FLOW

```text
Company Wallet
[Company's signing Wallet]
        ↓
signs Transaction
[Approves company registration]
        ↓
create_organization Instruction
[Creates the company record]
        ↓
StreamPay Program
[Creates the Organization PDA]
        ↓
Organization PDA
[Stores company authority and metadata]
```

Organization PDA is derived from:

```text
"organization"
+
Company Wallet
```

Conceptually:

```text
Company Wallet
      +
"organization"
      ↓
Organization PDA
```

---

# 25. M3.1 — TEST

## Test flow

```text
Create test Company Wallet
        ↓
Call create_organization
        ↓
Program creates Organization PDA
        ↓
Read Organization
        ↓
Check authority
        ↓
Check bump
        ↓
Check created_at
```

## Verified

```text
✅ Organization PDA created
✅ Authority correct
✅ Bump correct
✅ Created timestamp stored
```

Result:

```text
1 test passed

M3.1 = COMPLETE ✅
```

---

# 26. M3.2 — COMPANY-SPECIFIC VAULT

We changed the vault design so it belongs to an Organization.

The relationship is now:

```text
Organization PDA
        ↓
Company-specific Vault Authority PDA
        ↓
Company-specific Vault Token Account
        ↓
USDC
```

This prevents all companies from sharing one global vault for the same Token.

---

# 27. M3.2 — COMPANY VAULT FLOW

```text
Company Wallet
[Company controls the Organization]
        ↓
signs Transaction
[Approves vault creation]
        ↓
initialize_vault Instruction
[Requests the company vault]
        ↓
StreamPay Program
[Checks Organization authority]
        ↓
Vault PDA
[Derived from Organization + Mint]
        ↓
Vault Token Account
[Holds that company's Tokens]
```

---

# 28. M3.3 — COMPANY DEPOSIT

The deposit is now tied to the Organization.

```text
Company Wallet
        ↓
signs Transaction
        ↓
deposit Instruction
        ↓
StreamPay Program
        ↓
checks Organization authority
        ↓
checks company Token Account
        ↓
checks company-specific Vault
        ↓
CPI
        ↓
Token Program
        ↓
Vault receives Tokens
```

---

# 29. M3 — SECURITY TEST

We also tested an unauthorized wallet against an existing Organization.

Test idea:

```text
Company A
   ↓
Organization A
```

Then:

```text
Company B
   ↓
tries to use Organization A
   ↓
❌ rejected
```

Verified:

```text
✅ Unauthorized Organization access rejected
```

Important:

This test proves the Organization ownership rule.

A deeper direct test of unauthorized vault access belongs in the later security-testing phase (M6).

---

# 30. M3 — FULL TEST

## Test flow

```text
Create Company Wallet
        ↓
Create Mint
        ↓
Create Company Token Account
        ↓
Give Company 3,000 Tokens
        ↓
Create Organization
        ↓
Create Company-specific Vault
        ↓
Deposit 1,000 Tokens
        ↓
Read balances
        ↓
Check Vault Mint
        ↓
Check Vault Authority
```

## Verified

```text
✅ Organization created
✅ Company-specific Vault created
✅ Correct Mint
✅ Correct Vault Authority PDA
✅ Company balance = 2,000 USDC
✅ Vault balance = 1,000 USDC
✅ Deposit CPI works
```

Current test result:

```text
M3 Organization tests = 2 passed
M3 Company Vault test = 1 passed

M3 = COMPLETE ✅
```

---

# 31. WHAT WE HAVE BUILT SO FAR

```text
                    StreamPay Program
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      ProtocolConfig              Organization
           PDA                         PDA
             │                           │
             │                           ▼
             │                    Company Vault System
             │                           │
             │                    ┌──────┴──────┐
             │                    │             │
             │                    ▼             ▼
             │              Vault Token    Vault Authority
             │                 Account          PDA
             │                    │
             │                    ▼
             │                  USDC
             │
             └──── protocol metadata
```

---

# 32. COMPLETE FLOW WE HAVE BUILT

## M1

```text
Authority Wallet
[Approves initialization]
        ↓
Transaction
[Request]
        ↓
initialize_protocol
[Create protocol configuration]
        ↓
StreamPay Program
[Runs rules]
        ↓
ProtocolConfig PDA
[Stores protocol metadata]
```

## M2

```text
Company Wallet
[Approves deposit]
        ↓
Transaction
[Request]
        ↓
deposit
[Deposit action]
        ↓
StreamPay Program
[Checks rules]
        ↓
CPI
[Calls Token Program]
        ↓
Token Program
[Moves Tokens]
        ↓
Company Vault Token Account
[Stores deposited USDC]
```

## M3

```text
Company Wallet
[Company identity]
        ↓
create_organization
[Creates company record]
        ↓
Organization PDA
[Stores company authority]
        ↓
initialize_vault
[Creates company-specific vault]
        ↓
Company Vault
[Stores company Tokens]
        ↓
deposit
[Funds the company vault]
```

## M4

```text
Company Vault
      ↓
create_stream
[Creates payment agreement]
      ↓
Stream PDA
[Stores stream rules]
      ↓
Stream Escrow
[Stores reserved stream funds]
      ↓
Time passes
      ↓
Employee calls claim
      ↓
StreamPay calculates earned amount
      ↓
CPI
      ↓
Token Program
      ↓
Employee Token Account
```

---

# 33. PHASE-BY-PHASE TEST PATTERN

Every phase will follow the same pattern:

```text
1. Build
   [Does the Program compile?]

2. Unit / integration test
   [Does the real Instruction work?]

3. State verification
   [Did the expected Accounts change?]

4. Security / negative test
   [Does invalid or unauthorized behavior fail?]

5. Regression test
   [Did earlier phases continue to work?]
```

For completed phases:

```text
M1
Build ✅
Functional test ✅
State verification ✅
Security/validation ✅ where applicable
Regression ✅

M2
Build ✅
Vault test ✅
Deposit test ✅
Balance verification ✅
Zero-deposit rejection ✅
Regression ✅

M3
Build ✅
Organization test ✅
Company vault test ✅
Balance verification ✅
Unauthorized Organization test ✅
M1/M2 regression ✅
```

---

# 34. FUTURE TEST PLAN

## M4 — PAYMENT STREAM

### Goal

Create the actual payment agreement.

```text
Company
   ↓
Employee
   ↓
3,000 USDC
   ↓
30 days
```

### Planned test

```text
Create Company
        ↓
Create Employee
        ↓
Create Stream
        ↓
Read Stream Account
        ↓
Check company
Check employee
Check amount
Check start/end
Check claimed amount
```

Security tests:

```text
❌ wrong company
❌ invalid employee
❌ zero amount
❌ end before start
❌ invalid duration
```

Status:

```text
Company
   ↓
Employee
   ↓
Token amount
   ↓
Start time
   ↓
End time
```

---

# 35. M5 — CLAIM / CANCEL / TOP-UP

### Goal

Allow an employee to claim earned Tokens.

### Planned flow

```text
Employee Wallet
        ↓
signs Transaction
        ↓
Claim Instruction
        ↓
StreamPay Program
        ↓
calculates earned amount
        ↓
CPI
        ↓
Token Program
        ↓
Employee Token Account
```

### Planned tests

```text
✅ claim before start = 0/rejected as designed
✅ partial claim works
✅ repeated claim cannot double-count
✅ final claim works
✅ claimed amount updates
✅ cancel works
✅ top-up works
```

Status:

```text
M5 = PENDING ⏳
```

---

# 36. M6 — SECURITY + COMPREHENSIVE TESTS

### Goal

Attack our own protocol through invalid inputs.

### Planned tests

```text
❌ wrong signer
❌ wrong Organization
❌ wrong Vault
❌ wrong Mint
❌ wrong Token Program
❌ unauthorized claim
❌ double claim
❌ invalid timestamps
❌ arithmetic overflow/underflow
❌ replayed action
```

Regression:

```text
All previous M1-M5 tests must still pass.
```

Status:

```text
M6 = PENDING ⏳
```

---

# 37. M7 — FRONTEND

### Goal

Users interact with StreamPay from a web app.

### Planned test

```text
Connect Wallet
        ↓
Read Organization
        ↓
Show Vault
        ↓
Create Stream
        ↓
Show Stream
        ↓
Claim
        ↓
Refresh on-chain state
```

Also test:

```text
✅ wrong network handled
✅ transaction errors displayed
✅ wallet rejection handled
✅ balances refresh correctly
```

Status:

```text
M7 = PENDING ⏳
```

---

# 38. M8 — INDEXER / BACKEND

### Goal

Read blockchain activity and provide useful application data.

Important:

```text
Backend
[Reads and indexes blockchain state]

Backend does NOT
[decide how much an employee is allowed to claim]
```

### Planned test

```text
Solana Program event/activity
        ↓
Indexer
        ↓
Database
        ↓
API
        ↓
Frontend
```

Tests:

```text
✅ new Organization indexed
✅ new Stream indexed
✅ deposit indexed
✅ claim indexed
✅ duplicate events handled
✅ database state matches chain state
```

Status:

```text
M8 = PENDING ⏳
```

---

# 39. M9 — EVM GATEWAY

### Goal

Add the EVM-side gateway.

### Planned test

```text
EVM wallet
   ↓
Gateway
   ↓
validate message
   ↓
produce cross-chain instruction/message
```

Tests:

```text
✅ valid caller
✅ correct token
✅ correct destination
✅ invalid message rejected
✅ unauthorized caller rejected
```

Status:

```text
M9 = PENDING ⏳
```

---

# 40. M10 — CROSS-CHAIN MESSAGING

### Goal

Connect the EVM side and Solana side through Wormhole messaging.

### Planned test

```text
Chain A
   ↓
message
   ↓
Wormhole
   ↓
Solana
   ↓
StreamPay
```

Tests:

```text
✅ trusted source accepted
✅ unknown source rejected
✅ duplicate message rejected
✅ invalid payload rejected
✅ message state recorded
```

Status:

```text
M10 = PENDING ⏳
```

---

# 41. M11 — CROSS-CHAIN ASSETS

### Goal

Move/fund assets across chains.

### Planned test

```text
Source Chain
   ↓
cross-chain asset transfer
   ↓
Destination Chain
   ↓
StreamPay Vault
```

Tests:

```text
✅ correct amount
✅ correct destination
✅ correct token
✅ replay protection
✅ unauthorized source rejected
✅ final balance matches expected amount
```

Status:

```text
M11 = PENDING ⏳
```

---

# 42. M12 — DEVNET + DOCUMENTATION + PORTFOLIO

### Goal

Prepare the project for real demonstration and portfolio use.

### Planned test

```text
Build
  ↓
Deploy to Devnet
  ↓
Initialize protocol
  ↓
Create Organization
  ↓
Create Vault
  ↓
Deposit
  ↓
Create Stream
  ↓
Claim
  ↓
Verify final balances
```

Also verify:

```text
✅ README complete
✅ architecture diagram complete
✅ setup instructions work
✅ tests pass
✅ deployment instructions work
✅ demo flow works from start to finish
```

Status:

```text
M12 = PENDING ⏳
```

---

# 43. CURRENT ROADMAP

```text
M0 — Environment + Solana fundamentals     ✅
M1 — Protocol Configuration                 ✅
M2 — Token Vault + Deposits                 ✅
M3 — Company / Organization + Vault         ✅
M4 — Payment Stream                         ✅
M5 — Claim / Cancel / Top-up                ⏳
M6 — Security + Comprehensive Tests         ⏳
M7 — Frontend                               ⏳
M8 — Indexer / Backend                      ⏳
M9 — EVM Gateway                            ⏳
M10 — Cross-chain Messaging                 ⏳
M11 — Cross-chain Assets                    ⏳
M12 — Devnet + Docs + Portfolio             ⏳
```

---

# 44. CURRENT PROGRESS

```text
Completed:

M0 ✅
M1 ✅
M2 ✅
M3 ✅
M4 ✅

Pending:

M5 ⏳
M6 ⏳
M7 ⏳
M8 ⏳
M9 ⏳
M10 ⏳
M11 ⏳
M12 ⏳
```

---

# 45. THE BIG PICTURE

```text
Company Wallet
        ↓
Organization PDA
        ↓
Company Vault
        ↓
Deposit USDC
        ↓
Create Stream
        ↓
Employee earns over time
        ↓
Employee claims
        ↓
Employee receives Tokens
```

Later:

```text
EVM Chain
   ↓
Wormhole
   ↓
Solana
   ↓
StreamPay
```

---

# 46. THE MOST IMPORTANT MENTAL MODEL

```text
Program
[Rules]

Account
[Data]

Instruction
[Action]

Transaction
[Request]

Wallet
[Identity used to control funds and sign]

Signer
[Wallet approving the action]

PDA
[Program-derived special address]

CPI
[Program calls another Program]

Mint
[Defines a Token]

Token Account
[Holds a Token balance]

Token Program
[Manages Token operations]

Vault
[Token Account holding protocol funds]

Organization
[Company record]

Stream
[Payment agreement over time]
```

---

# 47. ONE FINAL PICTURE

```text
                 COMPANY
                    │
                    │
                    ▼
            ORGANIZATION PDA
                    │
                    │ owns/identifies
                    ▼
             COMPANY VAULT
                    │
                    │ contains
                    ▼
                  USDC
                    │
                    │ funds
                    ▼
                 STREAM
                    │
                    │ time passes
                    ▼
                EMPLOYEE
                    │
                    │ claims
                    ▼
                 TOKENS
```

Current foundation:

```text
M0 — Environment + Solana Fundamentals
[Set up Rust, Anchor, Solana CLI, testing tools, and learn the basic Solana concepts]
✅ Complete


M1 — Protocol Configuration
[Create the basic StreamPay protocol settings and store them in a ProtocolConfig PDA]
✅ Complete


M2 — Token Vault + Deposits
[Create a company-specific token vault and allow the company to deposit tokens into it]
✅ Complete


M3 — Company / Organization
[Create an Organization for a company and connect that company to its own vault]
✅ Complete


M4 — Payment Stream
[Create the payment agreement, reserve stream funds in escrow, calculate earned Tokens, and allow employees to claim earned Tokens]
✅ Complete


M5 — Claims / Cancel / Top-up
[Allow employees to claim earned money and manage existing streams]
⏳ Pending


M6 — Security + Comprehensive Tests
[Test unauthorized actions, invalid inputs, edge cases, replay protection, and other security risks]
⏳ Pending


M7 — Frontend
[Build the web interface for companies and employees to use StreamPay]
⏳ Pending


M8 — Backend / Indexer
[Read blockchain activity, store useful data, and provide it to the frontend]
⏳ Pending


M9 — EVM Gateway
[Create the Ethereum/EVM-side gateway for cross-chain interaction]
⏳ Pending


M10 — Cross-chain Messaging
[Connect chains using Wormhole messaging]
⏳ Pending


M11 — Cross-chain Assets
[Enable assets to move/fund the protocol across chains]
⏳ Pending


M12 — Devnet + Documentation + Portfolio
[Deploy, test the complete system on Devnet, document it, and prepare the final portfolio project]
⏳ Pending
```
