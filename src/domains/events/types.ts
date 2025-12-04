import {Immutables, DstImmutablesComplement} from '../immutables/index.js'
import {EvmAddress} from '../addresses/index.js'

/**
 * Event types emitted by cross-chain escrow contracts
 */
export enum EscrowEventType {
    SrcEscrowCreated = 'SrcEscrowCreated',
    DstEscrowCreated = 'DstEscrowCreated',
    EscrowCancelled = 'EscrowCancelled',
    FundsRescued = 'FundsRescued',
    EscrowWithdrawal = 'EscrowWithdrawal'
}

/**
 * Decoded SrcEscrowCreated event data
 */
export type SrcEscrowCreatedEvent = {
    type: EscrowEventType.SrcEscrowCreated
    srcImmutables: Immutables<EvmAddress>
    dstImmutablesComplement: DstImmutablesComplement<EvmAddress>
}

/**
 * Decoded DstEscrowCreated event data
 */
export type DstEscrowCreatedEvent = {
    type: EscrowEventType.DstEscrowCreated
    escrow: EvmAddress
    hashlock: string
    taker: EvmAddress
}

/**
 * Decoded EscrowCancelled event data
 */
export type EscrowCancelledEvent = {
    type: EscrowEventType.EscrowCancelled
}

/**
 * Decoded FundsRescued event data
 */
export type FundsRescuedEvent = {
    type: EscrowEventType.FundsRescued
    token: EvmAddress
    amount: bigint
}

/**
 * Decoded EscrowWithdrawal event data
 */
export type EscrowWithdrawalEvent = {
    type: EscrowEventType.EscrowWithdrawal
    secret: string
}

export type DecodedEscrowEvent =
    | SrcEscrowCreatedEvent
    | DstEscrowCreatedEvent
    | EscrowCancelledEvent
    | FundsRescuedEvent
    | EscrowWithdrawalEvent
