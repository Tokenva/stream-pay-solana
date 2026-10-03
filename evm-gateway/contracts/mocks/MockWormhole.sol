// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockWormhole {
    uint256 public fee;

    uint64 public sequence;

    uint32 public lastNonce;

    uint8 public lastConsistencyLevel;

    bytes public lastPayload;

    event LogMessagePublished(
        address indexed sender,
        uint64 sequence,
        uint32 nonce,
        bytes payload,
        uint8 consistencyLevel
    );

    constructor(uint256 initialFee) {
        fee = initialFee;
    }

    function setFee(
        uint256 newFee
    )
        external
    {
        fee = newFee;
    }

    function messageFee()
        external
        view
        returns (uint256)
    {
        return fee;
    }

    function publishMessage(
        uint32 nonce,
        bytes memory payload,
        uint8 consistencyLevel
    )
        external
        payable
        returns (uint64)
    {
        require(
            msg.value == fee,
            "invalid fee"
        );

        sequence += 1;

        lastNonce = nonce;
        lastPayload = payload;
        lastConsistencyLevel =
            consistencyLevel;

        emit LogMessagePublished(
            msg.sender,
            sequence,
            nonce,
            payload,
            consistencyLevel
        );

        return sequence;
    }
}
