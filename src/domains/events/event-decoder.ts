import {Interface, Log} from 'ethers'
import {
    EscrowEventType,
    DecodedEscrowEvent,
    SrcEscrowCreatedEvent,
    DstEscrowCreatedEvent,
    EscrowCancelledEvent,
    FundsRescuedEvent,
    EscrowWithdrawalEvent
} from './types.js'
import {Immutables, DstImmutablesComplement} from '../immutables/index.js'
import {FeeParameters} from '../fee-parameters/index.js'
import {EvmAddress} from '../addresses/index.js'
import {CROSS_CHAIN_ABI} from '../../abi/cross-chain-abi.js'

export class EventDecoder {
    private readonly crossChainInterface: Interface

    constructor() {
        this.crossChainInterface = new Interface(CROSS_CHAIN_ABI)
    }

    decode(log: Log): DecodedEscrowEvent | null {
        const factoryEvent = this.tryDecodeFactoryEvent(log)

        if (factoryEvent) {
            return factoryEvent
        }

        const escrowEvent = this.tryDecodeEscrowEvent(log)

        if (escrowEvent) {
            return escrowEvent
        }

        return null
    }

    decodeSrcEscrowCreated(
        data: string,
        topics: string[]
    ): SrcEscrowCreatedEvent {
        const decoded = this.crossChainInterface.decodeEventLog(
            'SrcEscrowCreated',
            data,
            topics
        )

        const srcImmutablesRaw = decoded.srcImmutables
        const dstComplementRaw = decoded.dstImmutablesComplement

        const srcImmutables = Immutables.fromJSON<EvmAddress>({
            orderHash: srcImmutablesRaw.orderHash,
            hashlock: srcImmutablesRaw.hashlock,
            maker: srcImmutablesRaw.maker,
            taker: srcImmutablesRaw.taker,
            token: srcImmutablesRaw.token,
            amount: srcImmutablesRaw.amount.toString(),
            safetyDeposit: srcImmutablesRaw.safetyDeposit.toString(),
            timelocks: srcImmutablesRaw.timelocks.toString(),
            parameters: srcImmutablesRaw.parameters
        })

        const dstImmutablesComplement = DstImmutablesComplement.new<EvmAddress>(
            {
                maker: EvmAddress.fromString(dstComplementRaw.maker),
                amount: BigInt(dstComplementRaw.amount),
                token: EvmAddress.fromString(dstComplementRaw.token),
                taker: EvmAddress.ZERO,
                safetyDeposit: BigInt(dstComplementRaw.safetyDeposit),
                chainId: BigInt(dstComplementRaw.chainId),
                feeParameters:
                    FeeParameters.fromHex(dstComplementRaw.parameters) ??
                    undefined
            }
        )

        return {
            type: EscrowEventType.SrcEscrowCreated,
            srcImmutables,
            dstImmutablesComplement
        }
    }

    decodeDstEscrowCreated(
        data: string,
        topics: string[]
    ): DstEscrowCreatedEvent {
        const decoded = this.crossChainInterface.decodeEventLog(
            'DstEscrowCreated',
            data,
            topics
        )

        return {
            type: EscrowEventType.DstEscrowCreated,
            escrow: EvmAddress.fromString(decoded.escrow),
            hashlock: decoded.hashlock,
            taker: EvmAddress.fromString(decoded.taker)
        }
    }

    decodeEscrowCancelled(): EscrowCancelledEvent {
        return {type: EscrowEventType.EscrowCancelled}
    }

    decodeFundsRescued(data: string, topics: string[]): FundsRescuedEvent {
        const decoded = this.crossChainInterface.decodeEventLog(
            'FundsRescued',
            data,
            topics
        )

        return {
            type: EscrowEventType.FundsRescued,
            token: EvmAddress.fromString(decoded.token),
            amount: BigInt(decoded.amount)
        }
    }

    decodeEscrowWithdrawal(
        data: string,
        topics: string[]
    ): EscrowWithdrawalEvent {
        const decoded = this.crossChainInterface.decodeEventLog(
            'EscrowWithdrawal',
            data,
            topics
        )

        return {
            type: EscrowEventType.EscrowWithdrawal,
            secret: decoded.secret
        }
    }

    private tryDecodeFactoryEvent(log: Log): DecodedEscrowEvent | null {
        try {
            const parsed = this.crossChainInterface.parseLog({
                topics: log.topics as string[],
                data: log.data
            })

            if (!parsed) return null

            switch (parsed.name) {
                case 'SrcEscrowCreated':
                    return this.decodeSrcEscrowCreated(
                        log.data,
                        log.topics as string[]
                    )
                case 'DstEscrowCreated':
                    return this.decodeDstEscrowCreated(
                        log.data,
                        log.topics as string[]
                    )
                default:
                    return null
            }
        } catch {
            return null
        }
    }

    private tryDecodeEscrowEvent(log: Log): DecodedEscrowEvent | null {
        try {
            const parsed = this.crossChainInterface.parseLog({
                topics: log.topics as string[],
                data: log.data
            })

            if (!parsed) return null

            switch (parsed.name) {
                case 'EscrowCancelled':
                    return this.decodeEscrowCancelled()
                case 'FundsRescued':
                    return this.decodeFundsRescued(
                        log.data,
                        log.topics as string[]
                    )
                case 'EscrowWithdrawal':
                    return this.decodeEscrowWithdrawal(
                        log.data,
                        log.topics as string[]
                    )
                default:
                    return null
            }
        } catch {
            return null
        }
    }
}

export const eventDecoder = new EventDecoder()
