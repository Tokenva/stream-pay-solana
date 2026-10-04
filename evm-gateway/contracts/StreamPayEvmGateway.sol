// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IWormhole} from "./interfaces/IWormhole.sol";

contract StreamPayEvmGateway is Ownable, Pausable, ReentrancyGuard {
    enum Action {
        CreateStream,
        TopUpStream,
        CancelStream
    }

    uint8 public constant MESSAGE_VERSION = 1;

    // Wormhole finalized consistency level.
    uint8 public constant WORMHOLE_FINALITY = 0;

    uint16 public immutable sourceWormholeChainId;

    uint16 public immutable destinationWormholeChainId;

    bytes32 public immutable solanaProgram;

    address public immutable wormhole;

    uint64 public nonce;

    mapping(bytes32 => bool) public usedOperationIds;

    struct Stream {
        bool exists;
        bool canceled;
        bytes32 organization;
        bytes32 employee;
        uint256 totalAmount;
        uint64 startTime;
        uint64 endTime;
    }

    mapping(bytes32 => Stream) public streams;

    error InvalidChainId();
    error InvalidSolanaProgram();
    error InvalidWormhole();
    error ZeroAmount();
    error AmountTooLarge();
    error InvalidTimeRange();
    error ZeroOperationId();
    error DuplicateOperation();
    error ZeroStreamId();
    error StreamAlreadyExists();
    error StreamNotFound();
    error StreamAlreadyCanceled();
    error NonceTooLarge();
    error InvalidWormholeFee();
    error StreamAlreadyStarted();

    event GatewayMessagePublished(
        bytes32 indexed operationId,
        bytes32 indexed streamId,
        uint8 indexed action,
        uint64 gatewayNonce,
        uint64 sequence,
        bytes32 payloadHash
    );

    event StreamIntentCreated(
        bytes32 indexed streamId,
        bytes32 indexed organization,
        bytes32 indexed employee,
        uint256 amount,
        uint64 startTime,
        uint64 endTime
    );

    event StreamIntentToppedUp(
        bytes32 indexed streamId,
        uint256 amount,
        uint256 newTotalAmount
    );

    event StreamIntentCanceled(bytes32 indexed streamId);

    constructor(
        uint16 _sourceWormholeChainId,
        uint16 _destinationWormholeChainId,
        bytes32 _solanaProgram,
        address _wormhole,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_sourceWormholeChainId == 0 || _destinationWormholeChainId == 0) {
            revert InvalidChainId();
        }

        if (_solanaProgram == bytes32(0)) {
            revert InvalidSolanaProgram();
        }

        if (_wormhole == address(0)) {
            revert InvalidWormhole();
        }

        sourceWormholeChainId = _sourceWormholeChainId;

        destinationWormholeChainId = _destinationWormholeChainId;

        solanaProgram = _solanaProgram;

        wormhole = _wormhole;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function wormholeMessageFee() external view returns (uint256) {
        return IWormhole(wormhole).messageFee();
    }

    function createStreamIntent(
        bytes32 operationId,
        bytes32 streamId,
        bytes32 organization,
        bytes32 employee,
        uint256 amount,
        uint64 startTime,
        uint64 endTime
    )
        external
        payable
        onlyOwner
        whenNotPaused
        nonReentrant
        returns (uint64 messageNonce)
    {
        _validateOperation(operationId);

        if (streamId == bytes32(0)) {
            revert ZeroStreamId();
        }

        if (amount == 0) {
            revert ZeroAmount();
        }

        if (amount > type(uint64).max) {
            revert AmountTooLarge();
        }

        if (startTime >= endTime) {
            revert InvalidTimeRange();
        }

        if (streams[streamId].exists) {
            revert StreamAlreadyExists();
        }

        usedOperationIds[operationId] = true;

        streams[streamId] = Stream({
            exists: true,
            canceled: false,
            organization: organization,
            employee: employee,
            totalAmount: amount,
            startTime: startTime,
            endTime: endTime
        });

        messageNonce = ++nonce;

        bytes memory payload = _encodePayload(
            Action.CreateStream,
            operationId,
            streamId,
            organization,
            employee,
            amount,
            startTime,
            endTime,
            messageNonce
        );

        uint64 sequence = _publishMessage(payload, messageNonce);

        emit StreamIntentCreated(
            streamId,
            organization,
            employee,
            amount,
            startTime,
            endTime
        );

        emit GatewayMessagePublished(
            operationId,
            streamId,
            uint8(Action.CreateStream),
            messageNonce,
            sequence,
            keccak256(payload)
        );
    }

    function topUpStreamIntent(
        bytes32 operationId,
        bytes32 streamId,
        uint256 amount
    )
        external
        payable
        onlyOwner
        whenNotPaused
        nonReentrant
        returns (uint64 messageNonce)
    {
        _validateOperation(operationId);

        if (amount == 0) {
            revert ZeroAmount();
        }

        if (amount > type(uint64).max) {
            revert AmountTooLarge();
        }

        Stream storage stream = streams[streamId];

        if (!stream.exists) {
            revert StreamNotFound();
        }

        if (stream.canceled) {
            revert StreamAlreadyCanceled();
        }

        if (block.timestamp >= stream.startTime) {
            revert StreamAlreadyStarted();
        }

        usedOperationIds[operationId] = true;

        stream.totalAmount += amount;

        messageNonce = ++nonce;

        bytes memory payload = _encodePayload(
            Action.TopUpStream,
            operationId,
            streamId,
            stream.organization,
            stream.employee,
            amount,
            stream.startTime,
            stream.endTime,
            messageNonce
        );

        uint64 sequence = _publishMessage(payload, messageNonce);

        emit StreamIntentToppedUp(streamId, amount, stream.totalAmount);

        emit GatewayMessagePublished(
            operationId,
            streamId,
            uint8(Action.TopUpStream),
            messageNonce,
            sequence,
            keccak256(payload)
        );
    }

    function cancelStreamIntent(
        bytes32 operationId,
        bytes32 streamId
    )
        external
        payable
        onlyOwner
        whenNotPaused
        nonReentrant
        returns (uint64 messageNonce)
    {
        _validateOperation(operationId);

        Stream storage stream = streams[streamId];

        if (!stream.exists) {
            revert StreamNotFound();
        }

        if (stream.canceled) {
            revert StreamAlreadyCanceled();
        }

        usedOperationIds[operationId] = true;

        stream.canceled = true;

        messageNonce = ++nonce;

        bytes memory payload = _encodePayload(
            Action.CancelStream,
            operationId,
            streamId,
            stream.organization,
            stream.employee,
            0,
            stream.startTime,
            stream.endTime,
            messageNonce
        );

        uint64 sequence = _publishMessage(payload, messageNonce);

        emit StreamIntentCanceled(streamId);

        emit GatewayMessagePublished(
            operationId,
            streamId,
            uint8(Action.CancelStream),
            messageNonce,
            sequence,
            keccak256(payload)
        );
    }

    function getStream(bytes32 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }

    function _validateOperation(bytes32 operationId) internal view {
        if (operationId == bytes32(0)) {
            revert ZeroOperationId();
        }

        if (usedOperationIds[operationId]) {
            revert DuplicateOperation();
        }
    }

    function _publishMessage(
        bytes memory payload,
        uint64 gatewayNonce
    ) internal returns (uint64 sequence) {
        if (gatewayNonce > type(uint32).max) {
            revert NonceTooLarge();
        }

        uint256 fee = IWormhole(wormhole).messageFee();

        if (msg.value != fee) {
            revert InvalidWormholeFee();
        }

        sequence = IWormhole(wormhole).publishMessage{value: fee}(
            uint32(gatewayNonce),
            payload,
            WORMHOLE_FINALITY
        );
    }

    function _encodePayload(
        Action action,
        bytes32 operationId,
        bytes32 streamId,
        bytes32 organization,
        bytes32 employee,
        uint256 amount,
        uint64 startTime,
        uint64 endTime,
        uint64 messageNonce
    ) internal view returns (bytes memory) {
        return
            abi.encode(
                MESSAGE_VERSION,
                uint8(action),
                sourceWormholeChainId,
                destinationWormholeChainId,
                operationId,
                solanaProgram,
                organization,
                employee,
                streamId,
                amount,
                startTime,
                endTime,
                messageNonce
            );
    }
}
