import fs from "node:fs";

import {
  wormhole,
  serialize,
} from "@wormhole-foundation/sdk";

import evm from
  "@wormhole-foundation/sdk/evm";

const TX_HASH =
  process.env.GATEWAY_TX_HASH;

if (!TX_HASH) {
  throw new Error(
    "GATEWAY_TX_HASH environment variable is required",
  );
}

async function main() {
  console.log(
    "Initializing Wormhole Testnet SDK...",
  );

  const wh =
    await wormhole(
      "Testnet",
      [evm],
    );

  const sourceChain =
    wh.getChain("Sepolia");

  console.log(
    `Source chain: ${sourceChain.chain}`,
  );

  console.log(
    `Transaction: ${TX_HASH}`,
  );

  console.log("");
  console.log(
    "Parsing Wormhole message from transaction...",
  );

  const messages =
    await sourceChain.parseTransaction(
      TX_HASH,
    );

  if (
    !messages ||
    messages.length === 0
  ) {
    throw new Error(
      "No Wormhole messages found in transaction",
    );
  }

  console.log(
    `Wormhole messages found: ${messages.length}`,
  );

  const message = messages[0];

  if (!message) {
    throw new Error(
      "Wormhole message could not be parsed",
    );
  }

  console.log("");
  console.log(
    "WORMHOLE MESSAGE IDENTIFIED",
  );

  console.log(
    "Fetching signed VAA...",
  );

  const vaa =
    await wh.getVaa(
      message,
      "Uint8Array",
      900_000,
    );

  if (!vaa) {
    throw new Error(
      "VAA was not available within 15 minutes",
    );
  }

  const fullVaa =
    Buffer.from(
      serialize(vaa),
    );

  /*
   * Serialized VAA layout:
   *
   * byte 0       = version
   * bytes 1..4   = guardian set index
   * byte 5       = signature count
   * next N*66    = guardian signatures
   * remaining    = VAA body
   */

  if (fullVaa.length < 6) {
    throw new Error(
      "Serialized VAA is too short",
    );
  }

  const version =
    fullVaa[0];

  const guardianSetIndex =
    fullVaa.readUInt32BE(1);

  const signatureCount =
    fullVaa[5];

  const signatures: number[][] =
    [];

  let signatureOffset = 6;

  for (
    let i = 0;
    i < signatureCount;
    i++
  ) {
    const end =
      signatureOffset + 66;

    if (
      end > fullVaa.length
    ) {
      throw new Error(
        "VAA ended while reading guardian signatures",
      );
    }

    signatures.push(
      Array.from(
        fullVaa.subarray(
          signatureOffset,
          end,
        ),
      ),
    );

    signatureOffset = end;
  }

  const vaaBody =
    fullVaa.subarray(
      signatureOffset,
    );

  if (vaaBody.length < 51) {
    throw new Error(
      "VAA body is too short",
    );
  }

  const payload =
    vaaBody.subarray(51);

  fs.mkdirSync(
    "artifacts/cross-chain",
    {
      recursive: true,
    },
  );

  const output = {
    transaction: TX_HASH,
    version,
    guardianSetIndex,
    signatureCount,
    signatures,
    vaaBodyHex:
      vaaBody.toString("hex"),
    payloadHex:
      payload.toString("hex"),
    fullVaaHex:
      fullVaa.toString("hex"),
  };

  fs.writeFileSync(
    "artifacts/cross-chain/vaa.json",
    JSON.stringify(
      output,
      null,
      2,
    ),
  );

  fs.writeFileSync(
    "artifacts/cross-chain/vaa-body.bin",
    vaaBody,
  );

  console.log("");
  console.log(
    "======================================",
  );

  console.log(
    "SIGNED VAA SAVED",
  );

  console.log(
    "======================================",
  );

  console.log(
    `VAA version: ${version}`,
  );

  console.log(
    `Guardian set index: ${guardianSetIndex}`,
  );

  console.log(
    `Signature count: ${signatureCount}`,
  );

  console.log(
    `Full VAA size: ${fullVaa.length} bytes`,
  );

  console.log(
    `VAA body size: ${vaaBody.length} bytes`,
  );

  console.log(
    `StreamPay payload size: ${payload.length} bytes`,
  );

  console.log("");

  console.log(
    "Saved:",
  );

  console.log(
    "artifacts/cross-chain/vaa.json",
  );

  console.log(
    "artifacts/cross-chain/vaa-body.bin",
  );

  console.log(
    "======================================",
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "VAA retrieval failed:",
    );
    console.error(error);
    process.exit(1);
  },
);