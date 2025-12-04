import {BitMask, BN, trim0x, UINT_128_MAX} from '@1inch/byte-utils'
import {
    FusionExtension,
    Extension,
    Whitelist,
    SurplusParams,
    ZX
} from '@1inch/fusion-sdk'
import assert from 'assert'
import {AddressComplement} from '../../domains/addresses/address-complement.js'
import {AuctionDetails} from '../../domains/auction-details/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {SupportedChain} from '../../chains.js'
import {
    AddressLike,
    EvmAddress,
    createAddress
} from '../../domains/addresses/index.js'
import {coder} from '../../utils/coder.js'
import {EscrowExtensionExtra} from './types.js'

/**
 * Extension for cross-chain escrow orders.
 * Adapts between Fusion and cross-chain postInteraction formats.
 *
 * Fusion format: [callback][flags][integrator][protocol][receiver?][fees+whitelist][surplus]
 * Cross-chain format: [callback][integrator][protocol][fees+whitelist][cross-chain-data]
 */
export class EscrowExtension extends FusionExtension {
    private static readonly CROSS_CHAIN_DATA_TYPES = [
        HashLock.Web3Type,
        'uint256',
        'uint256',
        'uint256',
        TimeLocks.Web3Type
    ] as const

    private static readonly CROSS_CHAIN_DATA_LENGTH = 320

    constructor(
        address: EvmAddress,
        auctionDetails: AuctionDetails,
        whitelist: Whitelist,
        public readonly hashLockInfo: HashLock,
        public readonly dstChainId: SupportedChain,
        public readonly dstToken: AddressLike,
        public readonly srcSafetyDeposit: bigint,
        public readonly dstSafetyDeposit: bigint,
        public readonly timeLocks: TimeLocks,
        public readonly dstAddressFirstPart: AddressComplement = AddressComplement.ZERO,
        extra?: EscrowExtensionExtra
    ) {
        assert(srcSafetyDeposit <= UINT_128_MAX, 'srcSafetyDeposit exceeds max')
        assert(dstSafetyDeposit <= UINT_128_MAX, 'dstSafetyDeposit exceeds max')

        super(
            address.inner,
            auctionDetails,
            whitelist,
            SurplusParams.NO_FEE,
            extra
        )

        this.dstToken = dstToken.zeroAsNative()
    }

    /**
     * Decode extension from encoded bytes
     */
    static decode(bytes: string): EscrowExtension {
        return EscrowExtension.fromExtension(Extension.decode(bytes))
    }

    /**
     * Create EscrowExtension from Extension (cross-chain format)
     */
    static fromExtension(extension: Extension): EscrowExtension {
        const pi = extension.postInteraction

        const crossChainData = EscrowExtension.decodeCrossChainData(
            '0x' + pi.slice(-EscrowExtension.CROSS_CHAIN_DATA_LENGTH)
        )

        const callbackEnd = 42
        const integratorEnd = 82
        const protocolEnd = 122
        const feeDataEnd = pi.length - EscrowExtension.CROSS_CHAIN_DATA_LENGTH

        const callback = pi.slice(0, callbackEnd)
        const integrator = pi.slice(callbackEnd, integratorEnd)
        const protocol = pi.slice(integratorEnd, protocolEnd)
        const feeAndWhitelist = pi.slice(protocolEnd, feeDataEnd)

        // Insert flags and surplus for Fusion decoder compatibility
        const postInteractionForFusion =
            callback +
            '00' +
            integrator +
            protocol +
            feeAndWhitelist +
            '0'.repeat(66)

        const fusionExt = FusionExtension.fromExtension(
            new Extension({
                ...extension,
                postInteraction: postInteractionForFusion
            })
        )

        const complement =
            extension.customData === ZX
                ? AddressComplement.ZERO
                : new AddressComplement(BigInt(extension.customData))

        return new EscrowExtension(
            EvmAddress.fromString(fusionExt.address.toString()),
            AuctionDetails.fromBase(fusionExt.auctionDetails),
            fusionExt.whitelist,
            crossChainData.hashLock,
            crossChainData.dstChainId,
            crossChainData.dstToken,
            crossChainData.srcSafetyDeposit,
            crossChainData.dstSafetyDeposit,
            crossChainData.timeLocks,
            complement,
            fusionExt.extra
        )
    }

    /**
     * Build extension in cross-chain format (strips flags and surplus from Fusion output)
     */
    override build(): Extension {
        const baseExt = super.build()
        const pi = baseExt.postInteraction

        const callbackEnd = 42
        const flagsEnd = 44
        const integratorEnd = 84
        const protocolEnd = 124

        const callback = pi.slice(0, callbackEnd)
        const integrator = pi.slice(flagsEnd, integratorEnd)
        const protocol = pi.slice(integratorEnd, protocolEnd)

        const flags = parseInt(pi.slice(callbackEnd, flagsEnd), 16)
        const hasCustomReceiver = (flags & 1) !== 0

        const feeDataStart = hasCustomReceiver ? protocolEnd + 40 : protocolEnd
        const feeDataEnd = pi.length - 66
        const feeAndWhitelist = pi.slice(feeDataStart, feeDataEnd)

        const postInteraction =
            callback +
            integrator +
            protocol +
            feeAndWhitelist +
            trim0x(this.encodeCrossChainData())

        return new Extension({
            ...baseExt,
            postInteraction,
            customData: this.encodeCustomData()
        })
    }

    private static decodeCrossChainData(bytes: string): {
        hashLock: HashLock
        dstChainId: number
        dstToken: AddressLike
        srcSafetyDeposit: bigint
        dstSafetyDeposit: bigint
        timeLocks: TimeLocks
    } {
        const [hashLock, dstChainId, dstToken, safetyDeposit, timeLocks] =
            coder.decode(EscrowExtension.CROSS_CHAIN_DATA_TYPES, bytes)

        const safetyDepositBN = new BN(safetyDeposit)

        return {
            hashLock: HashLock.fromString(hashLock),
            dstChainId: Number(dstChainId),
            dstToken: createAddress(dstToken.toString(), Number(dstChainId)),
            dstSafetyDeposit: safetyDepositBN.getMask(new BitMask(0n, 128n)).value,
            srcSafetyDeposit: safetyDepositBN.getMask(new BitMask(128n, 256n)).value,
            timeLocks: TimeLocks.fromBigInt(timeLocks)
        }
    }

    private encodeCrossChainData(): string {
        const packedSafetyDeposit =
            (this.srcSafetyDeposit << 128n) | this.dstSafetyDeposit

        return coder.encode(EscrowExtension.CROSS_CHAIN_DATA_TYPES, [
            this.hashLockInfo.toString(),
            this.dstChainId,
            this.dstToken.nativeAsZero().toHex(),
            packedSafetyDeposit,
            this.timeLocks.build()
        ])
    }

    private encodeCustomData(): string {
        if (!this.dstAddressFirstPart || this.dstAddressFirstPart.isZero()) {
            return ZX
        }

        return this.dstAddressFirstPart.asHex()
    }
}
