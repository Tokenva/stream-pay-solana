# StreamPay Solana — Learning Notes

# 1. WHAT ARE WE BUILDING?

StreamPay is a payroll/payment streaming protocol.

The basic idea:

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


Example:

Company wants to pay:

3,000 USDC

over:

30 days

Instead of:

Day 1 → employee gets all 3,000 USDC

we want:

Day 1 → small amount becomes earned
Day 2 → more becomes earned
...
Day 30 → full amount is earned


============================================================
# 2. CORE SOLANA WORDS
============================================================

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


============================================================
# 3. THE GENERAL SOLANA FLOW
============================================================

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


Example:

Company Wallet
[Company controls this Wallet]
        ↓
signs Transaction
[Company approves the action]
        ↓
Deposit Instruction
[We ask StreamPay to deposit tokens]
        ↓
StreamPay Program
[Our Rust smart contract checks the rules]
        ↓
Accounts change
[Token balances are updated]


============================================================
# 4. WHAT OUR PROGRAM DOES
============================================================

Our StreamPay Program contains the rules.

Today we have:

initialize_protocol
[Create the protocol configuration]

initialize_vault
[Create the protocol's token vault]

deposit
[Move tokens into the vault]


Later we will add:

create_organization
create_stream
claim
cancel_stream
top_up_stream
pause_protocol


============================================================
# 5. M1 — PROTOCOL CONFIGURATION
============================================================

STATUS: COMPLETE ✅


## Goal

Create the basic configuration of StreamPay.


## What did we create?

ProtocolConfig PDA
[On-chain account that stores StreamPay protocol metadata]


It stores:

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


============================================================
# 6. M1 — INITIALIZE PROTOCOL FLOW
============================================================

Authority Wallet
[Wallet that is allowed to initialize the protocol]
        ↓
signs Transaction
[Approves creation of the protocol configuration]
        ↓
initialize_protocol Instruction
[Action that creates the ProtocolConfig]
        ↓
StreamPay Program
[Checks the accounts and creates the PDA]
        ↓
ProtocolConfig PDA
[Stores protocol metadata]


In simple words:

Authority says:

"Create StreamPay's configuration."

The Program creates:

ProtocolConfig PDA

and stores:

authority
version
paused
bump
created_at


============================================================
# 7. M1 — WHY DO WE USE A PDA?
============================================================

We need a predictable address for the protocol configuration.

We use:

"protocol"

as the seed.

Conceptually:

StreamPay Program ID
        +
"protocol"
        ↓
ProtocolConfig PDA


So:

PDA
[Predictable program-derived address]

ProtocolConfig PDA
[The specific address where protocol settings live]


============================================================
# 8. M1 — CODE STRUCTURE
============================================================

state.rs
[Defines the ProtocolConfig data]

constants.rs
[Defines the PDA seed and protocol version]

initialize_protocol.rs
[Contains the logic for creating and initializing ProtocolConfig]

lib.rs
[Exposes initialize_protocol as a Program Instruction]

protocol_config.rs
[Tests that the instruction actually works]


============================================================
# 9. M1 — TEST
============================================================

We tested the real StreamPay Program using LiteSVM.

Test flow:

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


Verified:

✅ ProtocolConfig PDA created
✅ Authority correct
✅ Version = 1
✅ Paused = false
✅ PDA bump correct
✅ Created timestamp stored


M1 = COMPLETE ✅


============================================================
# 10. M2 — TOKEN VAULT
============================================================

STATUS: FUNCTIONALLY COMPLETE ✅


## Goal

Create a place where StreamPay can hold Tokens.


The idea:

Company
   ↓
Company Token Account
   ↓
deposit
   ↓
StreamPay Vault Token Account
   ↓
holds USDC


============================================================
# 11. IMPORTANT M2 PARTS
============================================================


Mint
[Defines the token]

Example:

USDC Mint
[Defines what the USDC token is]


Token Account
[Holds the actual USDC balance]

Example:

Company Token Account
[Holds company's USDC]

Vault Token Account
[Holds StreamPay's USDC]


Vault Authority PDA
[PDA used as the authority for the Vault]


So:

Mint
   ↓
defines the Token

Token Account
   ↓
holds the Token balance

Vault Token Account
   ↓
holds StreamPay funds

Vault Authority PDA
   ↓
controls the Vault


============================================================
# 12. M2.1 — CREATE THE VAULT
============================================================

Goal:

Create the Vault Token Account.


Flow:

Authority Wallet
[Pays for creating the Vault]
        ↓
signs Transaction
[Approves the vault creation]
        ↓
initialize_vault Instruction
[Action that creates the vault]
        ↓
StreamPay Program
[Checks the Mint, PDA addresses and authority]
        ↓
Token Program
[Creates the Token Account]
        ↓
Vault Token Account
[Stores StreamPay's future Token balance]


The Vault is initially:

0 USDC


============================================================
# 13. M2.1 — TWO IMPORTANT PDAs
============================================================


Vault PDA

"vault"
+
Mint
   ↓
Vault PDA


Vault Authority PDA

"vault-authority"
+
Mint
   ↓
Vault Authority PDA


Conceptually:

Vault Token Account
        ↓
controlled by
        ↓
Vault Authority PDA


============================================================
# 14. M2.1 — WHY THE MINT IS PART OF THE SEED
============================================================

We want a different vault for different tokens.

Conceptually:

"vault" + USDC Mint
        ↓
USDC Vault


"vault" + another Mint
        ↓
Another Token Vault


So the vault is connected to a specific Mint.


============================================================
# 15. M2.1 — TEST
============================================================

We tested:

Create Mint
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


Verified:

✅ Mint exists
✅ Vault created
✅ Vault is a Token Account
✅ Vault uses correct Mint
✅ Vault authority is correct PDA
✅ Initial balance = 0


M2.1 = COMPLETE ✅


============================================================
# 16. M2.2 — DEPOSIT TOKENS
============================================================

Now the Vault exists.

Next we need to move Tokens into it.


Example:

Company has:

3,000 USDC


Company wants to deposit:

1,000 USDC


Before:

Company Token Account = 3,000 USDC
Vault               = 0 USDC


After:

Company Token Account = 2,000 USDC
Vault               = 1,000 USDC


============================================================
# 17. M2.2 — DEPOSIT FLOW
============================================================

Company Wallet
[Company's identity and signing Wallet]
        ↓
signs Transaction
[Company approves the deposit]
        ↓
Deposit Instruction
[Asks StreamPay to deposit Tokens]
        ↓
StreamPay Program
[Checks that the source and destination are valid]
        ↓
CPI
[StreamPay asks another Program to perform the Token transfer]
        ↓
Token Program
[Actually performs the Token transfer]
        ↓
Vault Token Account
[Receives and stores the USDC]


============================================================
# 18. M2.2 — WHY DO WE USE CPI?
============================================================

StreamPay does NOT directly manage the Token balance.

The Token Program manages Token operations.

So:

StreamPay
   ↓
"I want to transfer these Tokens"
   ↓
CPI
   ↓
Token Program
   ↓
"Okay, I'll perform the transfer"


Therefore:

CPI
[Our Program calls another Program]


In our case:

StreamPay
   ↓ CPI
Token Program


============================================================
# 19. M2.2 — WHAT DOES DEPOSIT CHECK?
============================================================

The Program checks:

depositor
[The person depositing signed the transaction]

depositor Token Account
[The source account belongs to the depositor]

Mint
[The Token Account uses the expected Token]

Vault
[The destination is the correct StreamPay vault]

amount
[Must be greater than zero]


============================================================
# 20. M2.2 — THE ACTUAL TOKEN MOVEMENT
============================================================

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


After transfer:

Company Token Account
= 2,000 USDC

Vault Token Account
= 1,000 USDC


============================================================
# 21. M2.2 — SECURITY CHECK
============================================================

We also added a rule:

deposit amount must be greater than zero.


So:

deposit(1,000)
        ↓
✅ allowed


deposit(0)
        ↓
❌ rejected


This protects the Program from meaningless deposits.


============================================================
# 22. M2.2 — TEST
============================================================

Before:

Company = 3,000
Vault   = 0


Transaction:

deposit(1,000)


After:

Company = 2,000
Vault   = 1,000


Test verified:

✅ Token transfer worked
✅ Company balance decreased correctly
✅ Vault balance increased correctly
✅ CPI to Token Program worked
✅ Zero deposit rejected


M2.2 = COMPLETE ✅


============================================================
# 23. WHAT WE HAVE BUILT SO FAR
============================================================


                    StreamPay Program
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      ProtocolConfig               Vault System
           PDA                           │
             │                    ┌──────┴──────┐
             │                    │             │
             ▼                    ▼             ▼
      Protocol metadata     Vault Token    Vault Authority
                            Account            PDA
                               │
                               ▼
                              USDC


M1:

ProtocolConfig PDA
[Stores protocol metadata]


M2:

Vault Token Account
[Stores protocol funds]


Vault Authority PDA
[Controls the vault]


Deposit
[Moves Tokens into the vault through CPI]


============================================================
# 24. COMPLETE FLOW WE HAVE BUILT
============================================================

M1:

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
[Runs our rules]
        ↓
ProtocolConfig PDA
[Stores protocol metadata]


M2:

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
[Moves the Tokens]
        ↓
Vault Token Account
[Stores the deposited USDC]


============================================================
# 25. WHAT WE HAVE NOT BUILT YET
============================================================

M3 — Company / Treasury

We will connect a real organization/company to the protocol.


M4 — Stream

We will create:

Company
   ↓
Employee
   ↓
3,000 USDC
   ↓
30 days


M5 — Claim

Employee will claim the amount that has already been earned.


M6 — Security

More authorization checks
More edge cases
More tests


M7 — Frontend

Users will interact with StreamPay through a web application.


M8 — Indexer

Backend that reads blockchain activity and provides useful data.


M9-M11 — Cross-chain

EVM gateway
Wormhole messaging
Cross-chain assets


============================================================
# 26. THE FUTURE COMPLETE STORY
============================================================

Company Wallet
[Company's identity and signing Wallet]
        ↓
signs Transaction
[Approves creation of a payment]
        ↓
Create Stream Instruction
[Asks StreamPay to create a salary stream]
        ↓
StreamPay Program
[Checks all rules]
        ↓
Stream Account
[Stores the payment agreement]
        ↓
Vault
[Contains the Tokens that fund the stream]
        ↓
Time passes
[Employee earns the scheduled amount]
        ↓
Employee
[Owns the stream's payment]
        ↓
Claim Instruction
[Requests earned Tokens]
        ↓
StreamPay Program
[Checks how much is currently earned]
        ↓
CPI
[Calls Token Program]
        ↓
Employee Token Account
[Receives the Tokens]


============================================================
# 27. THE MOST IMPORTANT MENTAL MODEL
============================================================


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


Stream
[Payment agreement over time]


============================================================
# 28. CURRENT PROGRESS
============================================================

M1 — Protocol Configuration       ✅

M2.1 — Vault Creation             ✅

M2.2 — Token Deposit              ✅

M3 — Company / Treasury           ⏳

M4 — Payment Stream               ⏳

M5 — Claim                        ⏳

M6 — Security / Tests             ⏳

M7 — Frontend                     ⏳

M8 — Indexer                      ⏳

M9 — EVM Gateway                  ⏳

M10 — Cross-chain Messaging       ⏳

M11 — Cross-chain Assets          ⏳


============================================================
# 29. ONE FINAL PICTURE
============================================================


              COMPANY
                 │
                 │ deposits
                 ▼
             VAULT
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


M1 = Built the protocol foundation

M2 = Built the Token Vault and deposit system

M3 = Next: connect the system to a Company/Treasury
