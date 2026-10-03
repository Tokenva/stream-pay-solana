use anchor_lang::prelude::*;

#[error_code]
pub enum StreamPayError {
    #[msg("The protocol is already paused")]
    AlreadyPaused,

    #[msg("The protocol is not paused")]
    NotPaused,

    #[msg("The signer is not the protocol authority")]
    Unauthorized,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("There is nothing available to claim")]
    NothingToClaim,

    #[msg("The stream mint does not match the provided mint")]
    InvalidStreamMint,

    #[msg("The stream has already been canceled")]
    AlreadyCanceled,

    #[msg("The stream has been canceled")]
    StreamCanceled,

    #[msg("The stream has already started")]
    StreamAlreadyStarted,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("The cross-chain configuration is invalid")]
    InvalidCrossChainConfig,

    #[msg("The VAA body is invalid")]
    InvalidVaaBody,

    #[msg("The VAA source chain is not trusted")]
    InvalidVaaSourceChain,

    #[msg("The VAA emitter is not trusted")]
    InvalidVaaEmitter,

    #[msg("The VAA destination chain is invalid")]
    InvalidVaaDestination,

    #[msg("The VAA payload is invalid")]
    InvalidVaaPayload,

    #[msg("The VAA payload version is invalid")]
    InvalidVaaVersion,

    #[msg("The VAA action is invalid")]
    InvalidVaaAction,

    #[msg("The VAA sequence does not match")]
    InvalidVaaSequence,
}
