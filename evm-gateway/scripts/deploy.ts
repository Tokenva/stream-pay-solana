import "dotenv/config";

import { network } from "hardhat";
import bs58 from "bs58";

const { ethers, networkName } =
  await network.create();

const solanaProgramId =
  process.env.SOLANA_PROGRAM_ID;

const wormholeCore =
  process.env.WORMHOLE_CORE;

if (!solanaProgramId) {
  throw new Error(
    "SOLANA_PROGRAM_ID is not set",
  );
}

if (!wormholeCore) {
  throw new Error(
    "WORMHOLE_CORE is not set",
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
  ethers.hexlify(
    solanaProgramBytes,
  );

const [deployer] =
  await ethers.getSigners();

if (!deployer) {
  throw new Error(
    "No deployer account available",
  );
}

console.log(
  `Deploying Tokenva EvmGateway to ${networkName}...`,
);

console.log(
  `Deployer: ${deployer.address}`,
);

console.log(
  `Solana Program: ${solanaProgramId}`,
);

console.log(
  `Wormhole Core: ${wormholeCore}`,
);

const gateway =
  await ethers.deployContract(
    "TokenvaEvmGateway",
    [
      10002,
      1,
      solanaProgram,
      wormholeCore,
      deployer.address,
    ],
  );

console.log(
  "Waiting for deployment confirmation...",
);

await gateway.waitForDeployment();

const gatewayAddress =
  await gateway.getAddress();

const wormholeFee =
  await gateway.wormholeMessageFee();

console.log("");

console.log(
  "======================================",
);

console.log(
  "Tokenva EVM Gateway deployed",
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
  `Wormhole Core: ${wormholeCore}`,
);

console.log(
  `Wormhole Message Fee: ${ethers.formatEther(
    wormholeFee,
  )} ETH`,
);

console.log(
  "======================================",
);