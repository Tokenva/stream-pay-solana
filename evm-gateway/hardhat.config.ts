import hardhatToolboxMochaEthersPlugin from
  "@nomicfoundation/hardhat-toolbox-mocha-ethers";

import { defineConfig } from "hardhat/config";

const networks = {
  hardhatMainnet: {
    type: "edr-simulated" as const,
    chainType: "l1" as const,
  },

  ...(process.env.SEPOLIA_RPC_URL
    ? {
        sepolia: {
          type: "http" as const,
          chainType: "l1" as const,
          url: process.env.SEPOLIA_RPC_URL,
          accounts: process.env.SEPOLIA_PRIVATE_KEY
            ? [process.env.SEPOLIA_PRIVATE_KEY]
            : [],
        },
      }
    : {}),
};

const soliditySettings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
  viaIR: true,
};

export default defineConfig({
  plugins: [
    hardhatToolboxMochaEthersPlugin,
  ],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: soliditySettings,
      },

      production: {
        version: "0.8.28",
        settings: soliditySettings,
      },
    },
  },

  networks,
});