// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IWormhole {
    function messageFee()
        external
        view
        returns (uint256);

    function publishMessage(
        uint32 nonce,
        bytes memory payload,
        uint8 consistencyLevel
    )
        external
        payable
        returns (uint64 sequence);
}
