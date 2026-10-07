import "dotenv/config";

import { network } from "hardhat";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
const { ethers, networkName } =
  await network.create();

const GATEWAY_ADDRESS =
  "0x13a5b0be7F5841Ac2Cb0D07e71bB4209f469F104";

const gatewayAbi = [
  "function nonce() view returns (uint64)",
  "function sourceWormholeChainId() view returns (uint16)",
  "function destinationWormholeChainId() view returns (uint16)",
  "function wormholeMessageFee() view returns (uint256)",
  "function createStreamIntent(bytes32 operationId, bytes32 streamId, bytes32 organization, bytes32 employee, uint256 amount, uint64 startTime, uint64 endTime) external payable returns (uint64)",
  "event GatewayMessagePublished(bytes32 indexed operationId, bytes32 indexed streamId, uint8 indexed action, uint64 gatewayNonce, uint64 sequence, bytes32 payloadHash)",
];

const [deployer] =
  await ethers.getSigners();

if (!deployer) {
  throw new Error(
    "No deployer account",
  );
}

const gateway =
  new ethers.Contract(
    GATEWAY_ADDRESS,
    gatewayAbi,
    deployer,
  );

console.log(
  "Network:",
  networkName,
);

console.log(
  "Deployer:",
  await deployer.getAddress(),
);

console.log(
  "Gateway:",
  GATEWAY_ADDRESS,
);

const sourceChain =
  Number(
    await gateway.sourceWormholeChainId(),
  );

const destinationChain =
  Number(
    await gateway.destinationWormholeChainId(),
  );

const previousNonce =
  BigInt(
    await gateway.nonce(),
  );

console.log(
  "Current gateway nonce:",
  previousNonce.toString(),
);

const timestamp =
  Math.floor(
    Date.now() / 1000,
  );

const operationId =
  ethers.id(
    `tokenva-operation-${timestamp}`,
  );

const streamId =
  ethers.id(
    `tokenva-stream-${timestamp}`,
  );

const solanaOrganization =
  process.env.SOLANA_ORGANIZATION;

const solanaEmployee =
  process.env.SOLANA_EMPLOYEE;

if (!solanaOrganization) {
  throw new Error(
    "SOLANA_ORGANIZATION is required",
  );
}

if (!solanaEmployee) {
  throw new Error(
    "SOLANA_EMPLOYEE is required",
  );
}

const organization =
  ethers.hexlify(
    new SolanaPublicKey(
      solanaOrganization,
    ).toBytes(),
  );

const employee =
  ethers.hexlify(
    new SolanaPublicKey(
      solanaEmployee,
    ).toBytes(),
  );

const amount =
  2000n;

const startTime =
  BigInt(
    timestamp + 3600,
  );

const endTime =
  BigInt(
    timestamp + 7200,
  );

const fee =
  await gateway.wormholeMessageFee();

console.log(
  "Wormhole fee:",
  ethers.formatEther(fee),
  "ETH",
);

console.log("");
console.log(
  "Creating fresh stream intent through Tokenva Gateway...",
);

const createTx =
  await gateway.createStreamIntent(
    operationId,
    streamId,
    organization,
    employee,
    amount,
    startTime,
    endTime,
    {
      value: fee,
    },
  );

const createReceipt =
  await createTx.wait();

if (!createReceipt) {
  throw new Error(
    "Gateway transaction receipt was not available",
  );
}

console.log(
  "Gateway transaction:",
  createReceipt.hash,
);

const messageNonce =
  BigInt(
    await gateway.nonce(),
  );

if (
  messageNonce !==
  previousNonce + 1n
) {
  throw new Error(
    `Unexpected message nonce. Expected ${
      previousNonce + 1n
    }, got ${messageNonce}`,
  );
}

console.log(
  "Message nonce:",
  messageNonce.toString(),
);

let wormholeSequence:
  bigint | undefined;

for (
  const log of createReceipt.logs
) {
  try {
    const parsed =
      gateway.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });

    if (
      parsed &&
      parsed.name ===
        "GatewayMessagePublished"
    ) {
      wormholeSequence =
        BigInt(
          parsed.args.sequence,
        );

      console.log(
        "Wormhole sequence:",
        wormholeSequence.toString(),
      );

      break;
    }
  } catch {
    // Ignore logs that are not emitted by this ABI.
  }
}

if (
  wormholeSequence === undefined
) {
  throw new Error(
    "GatewayMessagePublished event was not found in the gateway transaction",
  );
}

console.log("");
console.log(
  "======================================",
);

console.log(
  "NEW WORMHOLE MESSAGE PUBLISHED",
);

console.log(
  "======================================",
);

console.log(
  "Gateway tx:",
  createReceipt.hash,
);

console.log(
  "Operation ID:",
  operationId,
);

console.log(
  "Stream ID:",
  streamId,
);

console.log(
  "Gateway nonce:",
  messageNonce.toString(),
);

console.log(
  "Wormhole sequence:",
  wormholeSequence.toString(),
);

console.log(
  "Source chain:",
  sourceChain,
);

console.log(
  "Destination chain:",
  destinationChain,
);

console.log(
  "Emitter:",
  GATEWAY_ADDRESS,
);

console.log(
  "======================================",
);