Program     = Rules
Account     = Data
Instruction = Action
PDA         = Program-controlled address
Signer      = Wallet that approves
Transaction = Request to do something
CPI         = Program calls another program
Token       = Digital money/value
Wallet      = User's account + identity for signing

Company Wallet
      ↓
signs Transaction
      ↓
Create Stream Instruction
      ↓
StreamPay Program
      ↓
creates Stream Account
      ↓
controls Token Vault

This is the basic story of our whole project.

------------------------------------------------------------------------------

Company Wallet
      ↓
signs Transaction
      ↓
Create/Deposit Instruction
      ↓
StreamPay Program
      ↓
CPI → Token Program
      ↓
Vault Token Account
      ↓
holds USDC


Vault
  ↓
Stream
  ↓
Employee
  ↓
Claim


Mint          = Defines the token
Token Account = Holds token balance
Token Program = Manages tokens
Vault         = Where our protocol keeps funds
Transfer = Move tokens

--------------------------------------------------------------------------------

Company
   ↓ deposits
Vault
   ↓ funds a
Stream
   ↓ earned over time
Employee
   ↓
Claim

--------------------------------------------------------------------------------

Company Wallet
      ↓
Company Token Account
      ↓
   deposit
      ↓
StreamPay Vault
      ↓
holds USDC

Vault Token Account = holds the USDC
Vault Authority     = PDA that StreamPay controls


Company signs
     ↓
Deposit instruction
     ↓
StreamPay
     ↓ CPI
Token Program
     ↓
Vault