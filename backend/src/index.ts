import express from "express";
import cors from "cors";

import { PublicKey } from "@solana/web3.js";

import { program } from "./solana.js";

const app = express();

app.use(cors());
app.use(express.json());

const port = Number(
  process.env.PORT ?? 4000,
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "streampay-backend",
  });
});

app.get("/api/streams", async (req, res) => {
  try {
    const accounts =
      await program.account.stream.all();

    const { organization, employee, canceled } =
      req.query;

    const streams = accounts
      .map(({ publicKey, account }) => ({
        address: publicKey.toBase58(),
        organization:
          account.organization.toBase58(),
        employee:
          account.employee.toBase58(),
        vault:
          account.vault.toBase58(),
        escrow:
          account.escrow.toBase58(),
        mint:
          account.mint.toBase58(),
        streamId:
          account.streamId.toString(),
        totalAmount:
          account.totalAmount.toString(),
        startTime:
          account.startTime.toString(),
        endTime:
          account.endTime.toString(),
        claimedAmount:
          account.claimedAmount.toString(),
        canceled:
          account.canceled,
        cancelTime:
          account.cancelTime.toString(),
      }))
      .filter((stream) => {
        if (
          typeof organization === "string" &&
          stream.organization !== organization
        ) {
          return false;
        }

        if (
          typeof employee === "string" &&
          stream.employee !== employee
        ) {
          return false;
        }

        if (typeof canceled === "string") {
          const expected = canceled === "true";

          if (stream.canceled !== expected) {
            return false;
          }
        }

        return true;
      });

    res.json({
      count: streams.length,
      streams,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch streams",
    });
  }
});

app.get(
  "/api/streams/:address",
  async (req, res) => {
    try {
      const address = new PublicKey(
        req.params.address,
      );

      const account =
        await program.account.stream.fetch(
          address,
        );

      res.json({
        address: address.toBase58(),
        organization:
          account.organization.toBase58(),
        employee:
          account.employee.toBase58(),
        vault:
          account.vault.toBase58(),
        escrow:
          account.escrow.toBase58(),
        mint:
          account.mint.toBase58(),
        streamId:
          account.streamId.toString(),
        totalAmount:
          account.totalAmount.toString(),
        startTime:
          account.startTime.toString(),
        endTime:
          account.endTime.toString(),
        claimedAmount:
          account.claimedAmount.toString(),
        canceled:
          account.canceled,
        cancelTime:
          account.cancelTime.toString(),
      });
    } catch (error) {
      console.error(error);

      res.status(404).json({
        error: "Stream not found",
      });
    }
  },
);

app.listen(port, () => {
  console.log(
    `StreamPay backend running at http://localhost:${port}`,
  );
});