import { expect } from "chai";
import { anyValue } from
  "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { network } from "hardhat";

const { ethers } = await network.create();

describe(
  "TokenvaEvmGateway",
  function () {
    async function deployGateway() {
      const [owner, attacker] =
        await ethers.getSigners();

      const wormhole =
        await ethers.deployContract(
          "MockWormhole",
          [0],
        );

      const solanaProgram =
        ethers.zeroPadValue(
          "0x01",
          32,
        );

      const gateway =
        await ethers.deployContract(
          "TokenvaEvmGateway",
          [
            10002,
            1,
            solanaProgram,
            await wormhole.getAddress(),
            owner.address,
          ],
        );

      return {
        gateway,
        wormhole,
        owner,
        attacker,
      };
    }

    function ids() {
      return {
        operationId: ethers.keccak256(
          ethers.toUtf8Bytes(
            "operation-1",
          ),
        ),

        streamId: ethers.keccak256(
          ethers.toUtf8Bytes(
            "stream-1",
          ),
        ),

        organization: ethers.keccak256(
          ethers.toUtf8Bytes(
            "organization-1",
          ),
        ),

        employee: ethers.keccak256(
          ethers.toUtf8Bytes(
            "employee-1",
          ),
        ),
      };
    }

    describe("Deployment", function () {
      it(
        "stores the configured chain IDs and Solana program",
        async function () {
          const { gateway } =
            await deployGateway();

          expect(
            await gateway
              .sourceWormholeChainId(),
          ).to.equal(10002);

          expect(
            await gateway
              .destinationWormholeChainId(),
          ).to.equal(1);
        },
      );
    });

    describe("Wormhole messaging", function () {
      it(
        "publishes a create stream message",
        async function () {
          const {
            gateway,
            wormhole,
          } = await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await expect(
            gateway.createStreamIntent(
              operationId,
              streamId,
              organization,
              employee,
              1_000n,
              1_800_000_000,
              1_800_100_000,
            ),
          )
            .to.emit(
              gateway,
              "GatewayMessagePublished",
            )
            .withArgs(
              operationId,
              streamId,
              0,
              1,
              1,
              anyValue,
            );

          expect(
            await wormhole.sequence(),
          ).to.equal(1);

          expect(
            await wormhole.lastNonce(),
          ).to.equal(1);

          expect(
            await wormhole
              .lastConsistencyLevel(),
          ).to.equal(0);

          expect(
            await wormhole.lastPayload(),
          ).to.not.equal("0x");
        },
      );

      it(
        "rejects an incorrect Wormhole fee",
        async function () {
          const {
            gateway,
            wormhole,
          } = await deployGateway();

          await wormhole.setFee(1n);

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await expect(
            gateway.createStreamIntent(
              operationId,
              streamId,
              organization,
              employee,
              1_000n,
              1_800_000_000,
              1_800_100_000,
              {
                value: 0,
              },
            ),
          ).to.be.revertedWithCustomError(
            gateway,
            "InvalidWormholeFee",
          );
        },
      );
    });

    describe("Create stream", function () {
      it(
        "rejects a duplicate operation ID",
        async function () {
          const { gateway } =
            await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await gateway.createStreamIntent(
            operationId,
            streamId,
            organization,
            employee,
            1_000n,
            1_800_000_000,
            1_800_100_000,
          );

          await expect(
            gateway.createStreamIntent(
              operationId,
              ethers.keccak256(
                ethers.toUtf8Bytes(
                  "stream-2",
                ),
              ),
              organization,
              employee,
              1_000n,
              1_800_000_000,
              1_800_100_000,
            ),
          ).to.be.revertedWithCustomError(
            gateway,
            "DuplicateOperation",
          );
        },
      );

      it(
        "rejects invalid time ranges",
        async function () {
          const { gateway } =
            await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await expect(
            gateway.createStreamIntent(
              operationId,
              streamId,
              organization,
              employee,
              1_000n,
              1_800_100_000,
              1_800_000_000,
            ),
          ).to.be.revertedWithCustomError(
            gateway,
            "InvalidTimeRange",
          );
        },
      );
    });

    describe("Authorization", function () {
      it(
        "allows only the owner to create intents",
        async function () {
          const {
            gateway,
            attacker,
          } = await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await expect(
            gateway
              .connect(attacker)
              .createStreamIntent(
                operationId,
                streamId,
                organization,
                employee,
                1_000n,
                1_800_000_000,
                1_800_100_000,
              ),
          ).to.be.revertedWithCustomError(
            gateway,
            "OwnableUnauthorizedAccount",
          );
        },
      );
    });

    describe("Top-up", function () {
      it(
  "rejects a top-up after the stream has started",
  async function () {
    const { gateway } =
      await deployGateway();

    const {
      operationId,
      streamId,
      organization,
      employee,
    } = ids();

    const latestBlock =
      await ethers.provider.getBlock(
        "latest",
      );

    const startTime =
      BigInt(
        latestBlock!.timestamp + 60,
      );

    const endTime =
      startTime + 3_600n;

    await gateway.createStreamIntent(
      operationId,
      streamId,
      organization,
      employee,
      1_000n,
      startTime,
      endTime,
    );

    await ethers.provider.send(
      "evm_increaseTime",
      [120],
    );

    await ethers.provider.send(
      "evm_mine",
      [],
    );

    const topUpOperation =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "top-up-after-start",
        ),
      );

    await expect(
      gateway.topUpStreamIntent(
        topUpOperation,
        streamId,
        500n,
      ),
    ).to.be.revertedWithCustomError(
      gateway,
      "StreamAlreadyStarted",
    );
  },
);
      it(
        "increases the stream amount",
        async function () {
          const { gateway } =
            await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await gateway.createStreamIntent(
            operationId,
            streamId,
            organization,
            employee,
            1_000n,
            1_800_000_000,
            1_800_100_000,
          );

          const topUpOperation =
            ethers.keccak256(
              ethers.toUtf8Bytes(
                "top-up-operation",
              ),
            );

          await gateway.topUpStreamIntent(
            topUpOperation,
            streamId,
            500n,
          );

          const stream =
            await gateway.getStream(
              streamId,
            );

          expect(
            stream.totalAmount,
          ).to.equal(1_500n);
        },
      );
    });

    describe("Cancellation", function () {
      it(
        "marks the stream cancelled",
        async function () {
          const { gateway } =
            await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await gateway.createStreamIntent(
            operationId,
            streamId,
            organization,
            employee,
            1_000n,
            1_800_000_000,
            1_800_100_000,
          );

          const cancelOperation =
            ethers.keccak256(
              ethers.toUtf8Bytes(
                "cancel-operation",
              ),
            );

          await gateway.cancelStreamIntent(
            cancelOperation,
            streamId,
          );

          const stream =
            await gateway.getStream(
              streamId,
            );

          expect(
            stream.canceled,
          ).to.equal(true);
        },
      );

      it(
        "rejects a top-up after cancellation",
        async function () {
          const { gateway } =
            await deployGateway();

          const {
            operationId,
            streamId,
            organization,
            employee,
          } = ids();

          await gateway.createStreamIntent(
            operationId,
            streamId,
            organization,
            employee,
            1_000n,
            1_800_000_000,
            1_800_100_000,
          );

          await gateway.cancelStreamIntent(
            ethers.keccak256(
              ethers.toUtf8Bytes(
                "cancel-operation",
              ),
            ),
            streamId,
          );

          await expect(
            gateway.topUpStreamIntent(
              ethers.keccak256(
                ethers.toUtf8Bytes(
                  "top-up-after-cancel",
                ),
              ),
              streamId,
              100n,
            ),
          ).to.be.revertedWithCustomError(
            gateway,
            "StreamAlreadyCanceled",
          );
        },
      );
    });
  },
);