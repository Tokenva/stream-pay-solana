// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract StreamPayEvmGateway is Ownable, Pausable {
    enum Action {
        CreateStream,
        TopUpStream,
        CancelStream
    }

    uint8 public constant MESSAGE_VERSION = 1;

    uint16 public immutable sourceWormholeChainId;

    uint16 public destinationWormholeChainId;

    bytes32 public solanaProgram;

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
    error ZeroAmount();
    error AmountTooLarge();
    error InvalidTimeRange();
    error ZeroOperationId();
    error DuplicateOperation();
    error ZeroStreamId();
    error StreamAlreadyExists();
    error StreamNotFound();
    error StreamAlreadyCanceled();

    event SolanaProgramUpdated(
        bytes32 indexed oldProgram,
        bytes32 indexed newProgram
    );

    event DestinationChainUpdated(
        uint16 indexed oldChain,
        uint16 indexed newChain
    );

    event GatewayMessagePrepared(
        bytes32 indexed operationId,
        bytes32 indexed streamId,
        uint8 indexed action,
        uint64 nonce,
        bytes payload
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

    event StreamIntentCanceled(
        bytes32 indexed streamId
    );

    constructor(
        uint16 _sourceWormholeChainId,
        uint16 _destinationWormholeChainId,
        bytes32 _solanaProgram,
        address initialOwner
    ) Ownable(initialOwner) {
        if (
            _sourceWormholeChainId == 0 ||
            _destinationWormholeChainId == 0
        ) {
            revert InvalidChainId();
        }

        if (_solanaProgram == bytes32(0)) {
            revert InvalidSolanaProgram();
        }

        sourceWormholeChainId =
            _sourceWormholeChainId;

        destinationWormholeChainId =
            _destinationWormholeChainId;

        solanaProgram = _solanaProgram;
    }

    function setSolanaProgram(
        bytes32 newProgram
    ) external onlyOwner {
        if (newProgram == bytes32(0)) {
            revert InvalidSolanaProgram();
        }

        bytes32 oldProgram = solanaProgram;

        solanaProgram = newProgram;

        emit SolanaProgramUpdated(
            oldProgram,
            newProgram
        );
    }

    function setDestinationWormholeChain(
        uint16 newChain
    ) external onlyOwner {
        if (newChain == 0) {
            revert InvalidChainId();
        }

        uint16 oldChain =
            destinationWormholeChainId;

        destinationWormholeChainId = newChain;

        emit DestinationChainUpdated(
            oldChain,
            newChain
        );
    }

    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    function unpause()
        external
        onlyOwner
    {
        _unpause();
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
        onlyOwner
        whenNotPaused
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

        bytes memory payload =
            _encodePayload(
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

        emit StreamIntentCreated(
            streamId,
            organization,
            employee,
            amount,
            startTime,
            endTime
        );

        emit GatewayMessagePrepared(
            operationId,
            streamId,
            uint8(Action.CreateStream),
            messageNonce,
            payload
        );
    }

    function topUpStreamIntent(
        bytes32 operationId,
        bytes32 streamId,
        uint256 amount
    )
        external
        onlyOwner
        whenNotPaused
        returns (uint64 messageNonce)
    {
        _validateOperation(operationId);

        if (amount == 0) {
            revert ZeroAmount();
        }

        if (amount > type(uint64).max) {
            revert AmountTooLarge();
        }

        Stream storage stream =
            streams[streamId];

        if (!stream.exists) {
            revert StreamNotFound();
        }

        if (stream.canceled) {
            revert StreamAlreadyCanceled();
        }

        usedOperationIds[operationId] = true;

        stream.totalAmount += amount;

        messageNonce = ++nonce;

        bytes memory payload =
            _encodePayload(
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

        emit StreamIntentToppedUp(
            streamId,
            amount,
            stream.totalAmount
        );

        emit GatewayMessagePrepared(
            operationId,
            streamId,
            uint8(Action.TopUpStream),
            messageNonce,
            payload
        );
    }

    function cancelStreamIntent(
        bytes32 operationId,
        bytes32 streamId
    )
        external
        onlyOwner
        whenNotPaused
        returns (uint64 messageNonce)
    {
        _validateOperation(operationId);

        Stream storage stream =
            streams[streamId];

        if (!stream.exists) {
            revert StreamNotFound();
        }

        if (stream.canceled) {
            revert StreamAlreadyCanceled();
        }

        usedOperationIds[operationId] = true;

        stream.canceled = true;

        messageNonce = ++nonce;

        bytes memory payload =
            _encodePayload(
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

        emit StreamIntentCanceled(
            streamId
        );

        emit GatewayMessagePrepared(
            operationId,
            streamId,
            uint8(Action.CancelStream),
            messageNonce,
            payload
        );
    }

    function getStream(
        bytes32 streamId
    )
        external
        view
        returns (Stream memory)
    {
        return streams[streamId];
    }

    function _validateOperation(
        bytes32 operationId
    ) internal view {
        if (operationId == bytes32(0)) {
            revert ZeroOperationId();
        }

        if (usedOperationIds[operationId]) {
            revert DuplicateOperation();
        }
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
    )
        internal
        view
        returns (bytes memory)
    {
        return abi.encode(
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
