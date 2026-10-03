import "dotenv/config";

import { network } from "hardhat";
import bs58 from "bs58";

const { ethers, networkName } =
  await network.create();

const solanaProgramId =
  process.env.SOLANA_PROGRAM_ID;

if (!solanaProgramId) {
  throw new Error(
    "SOLANA_PROGRAM_ID is not set",
  );
}

const solanaProgramBytes =
  bs58.decode(solanaProgramId);

if (solanaProgramBytes.length !== 32) {
  throw new Error(
    "SOLANA_PROGRAM_ID must decode to exactly 32 bytes",
  );
}

const solanaProgram =
  ethers.hexlify(solanaProgramBytes);

const [deployer] =
  await ethers.getSigners();

if (!deployer) {
  throw new Error(
    "No deployer account available",
  );
}

console.log(
  `Deploying StreamPayEvmGateway to ${networkName}...`,
);

console.log(
  `Deployer: ${deployer.address}`,
);

console.log(
  `Solana Program: ${solanaProgramId}`,
);

const gateway =
  await ethers.deployContract(
    "StreamPayEvmGateway",
    [
      10002,
      1,
      solanaProgram,
      deployer.address,
    ],
  );

console.log(
  "Waiting for deployment confirmation...",
);

await gateway.waitForDeployment();

const gatewayAddress =
  await gateway.getAddress();

console.log("");
console.log(
  "======================================",
);
console.log(
  "StreamPay EVM Gateway deployed",
);
console.log(
  "======================================",
);
console.log(
  `Contract: ${gatewayAddress}`,
);
console.log(
  `Network: ${networkName}`,
);
console.log(
  `Deployer: ${deployer.address}`,
);
console.log(
  `Solana Program: ${solanaProgramId}`,
);
console.log(
  "======================================",
);
