import "dotenv/config";

import { network } from "hardhat";

const { ethers, networkName } =
  await network.create();

const GATEWAY_ADDRESS =
  "0x13a5b0be7F5841Ac2Cb0D07e71bB4209f469F104";

const STREAM_ID =
  process.env.STREAM_ID ??
  "0x6f2e2d30c89ea945bd168bf291ff0a35936f9cdb2295200752b52a72b12db7b5";

if (!/^0x[0-9a-fA-F]{64}$/.test(STREAM_ID)) {
  throw new Error(
    "STREAM_ID must be a 32-byte 0x-prefixed hex value",
  );
}

const TOP_UP_AMOUNT =
  1000n;

const gatewayAbi = [
  "function nonce() view returns (uint64)",
  "function wormholeMessageFee() view returns (uint256)",
  "function topUpStreamIntent(bytes32 operationId, bytes32 streamId, uint256 amount) external payable returns (uint64)",
  "function getStream(bytes32 streamId) view returns (bool exists, bool canceled, bytes32 organization, bytes32 employee, uint256 totalAmount, uint64 startTime, uint64 endTime)",
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

console.log(
  "Target stream:",
  STREAM_ID,
);

const stream =
  await gateway.getStream(
    STREAM_ID,
  );

if (!stream.exists) {
  throw new Error(
    "Target stream does not exist on the EVM gateway",
  );
}

if (stream.canceled) {
  throw new Error(
    "Target stream is already canceled",
  );
}

console.log("");
console.log(
  "Existing stream state:",
);

console.log(
  "Organization:",
  stream.organization,
);

console.log(
  "Employee:",
  stream.employee,
);

console.log(
  "Current total:",
  stream.totalAmount.toString(),
);

console.log(
  "Start time:",
  stream.startTime.toString(),
);

console.log(
  "End time:",
  stream.endTime.toString(),
);

const currentTime =
  BigInt(
    Math.floor(
      Date.now() / 1000,
    ),
  );

if (
  currentTime >=
  BigInt(stream.startTime)
) {
  throw new Error(
    "The Solana TopUpStream instruction only accepts top-ups before the stream start time. The existing stream has already started.",
  );
}

const previousNonce =
  BigInt(
    await gateway.nonce(),
  );

const timestamp =
  Math.floor(
    Date.now() / 1000,
  );

const operationId =
  ethers.id(
    `streampay-topup-operation-${timestamp}`,
  );

const fee =
  await gateway.wormholeMessageFee();

console.log("");
console.log(
  "Top-up amount:",
  TOP_UP_AMOUNT.toString(),
);

console.log(
  "Wormhole fee:",
  ethers.formatEther(fee),
  "ETH",
);

console.log("");
console.log(
  "Publishing TopUpStream intent...",
);

const tx =
  await gateway.topUpStreamIntent(
    operationId,
    STREAM_ID,
    TOP_UP_AMOUNT,
    {
      value: fee,
    },
  );

const receipt =
  await tx.wait();

if (!receipt) {
  throw new Error(
    "Gateway transaction receipt was not available",
  );
}

console.log(
  "Gateway transaction:",
  receipt.hash,
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
  const log of receipt.logs
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

      break;
    }
  } catch {
    // Ignore unrelated logs.
  }
}

if (
  wormholeSequence === undefined
) {
  throw new Error(
    "GatewayMessagePublished event was not found",
  );
}

console.log("");
console.log(
  "======================================",
);

console.log(
  "NEW TOP-UP WORMHOLE MESSAGE PUBLISHED",
);

console.log(
  "======================================",
);

console.log(
  "Gateway tx:",
  receipt.hash,
);

console.log(
  "Operation ID:",
  operationId,
);

console.log(
  "Stream ID:",
  STREAM_ID,
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
  "Top-up amount:",
  TOP_UP_AMOUNT.toString(),
);

console.log(
  "======================================",
);
