import {
    BitMask,
    BN,
    UINT_128_MAX,
    BytesIter,
    BytesBuilder
} from '@1inch/byte-utils'
import {
    FusionExtension,
    Extension,
    Whitelist,
    SurplusParams,
    ZX,
    Address
} from '@1inch/fusion-sdk'
import assert from 'assert'
import {EscrowExtensionExtra} from './types.js'
import {AddressComplement} from '../../domains/addresses/address-complement.js'
import {
    AuctionDetails,
    AuctionPoint
} from '../../domains/auction-details/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {SupportedChain} from '../../chains.js'
import {
    AddressLike,
    EvmAddress,
    createAddress
} from '../../domains/addresses/index.js'
import {coder} from '../../utils/coder.js'

/**
 * Extension for cross-chain escrow orders.
 */
export class EscrowExtension extends FusionExtension {
    private static readonly CROSS_CHAIN_DATA_TYPES = [
        HashLock.Web3Type,
        'uint256', // dst chain id
        'uint256', // dst token
        'uint256', // src/dst safety deposit
        TimeLocks.Web3Type
    ] as const

    /** Cross-chain data is 160 bytes */
    private static readonly CROSS_CHAIN_DATA_BYTES = 160

    // eslint-disable-next-line max-params
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
     * Create EscrowExtension from Extension (with fallback for old format)
     */
    static fromExtension(extension: Extension): EscrowExtension {
        try {
            return EscrowExtension.fromExtensionV2(extension)
        } catch {
            return EscrowExtension.fromExtensionV1(extension)
        }
    }

    private static fromExtensionV2(extension: Extension): EscrowExtension {
        const pi = extension.postInteraction

        const crossChainData = EscrowExtension.decodeCrossChainData(
            BytesIter.HexString(pi).nextBytes(
                EscrowExtension.CROSS_CHAIN_DATA_BYTES,
                BytesIter.SIDE.Back
            )
        )

        const iter = BytesIter.HexString(pi)
        const callback = iter.nextAddress()
        const integrator = iter.nextAddress()
        const protocol = iter.nextAddress()

        const restBytes = (iter.rest().length - 2) / 2
        const feeAndWhitelistLength =
            restBytes - EscrowExtension.CROSS_CHAIN_DATA_BYTES
        const feeAndWhitelist = iter.nextBytes(feeAndWhitelistLength)

        const postInteractionForFusion = new BytesBuilder()
            .addAddress(callback)
            .addUint8(0n) // flags
            .addAddress(integrator)
            .addAddress(protocol)
            .addBytes(feeAndWhitelist)
            .addBytes('0x' + '0'.repeat(66)) // surplus
            .asHex()

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

    private static fromExtensionV1(extension: Extension): EscrowExtension {
        const postIter = BytesIter.HexString(extension.postInteraction)

        const crossChainHex = postIter.nextBytes(
            EscrowExtension.CROSS_CHAIN_DATA_BYTES,
            BytesIter.SIDE.Back
        )
        const crossChainData =
            EscrowExtension.decodeCrossChainData(crossChainHex)

        const factory = EvmAddress.fromString(postIter.nextAddress())
        const whitelist = EscrowExtension.decodeWhitelistV1(postIter.rest())

        const makingIter = BytesIter.HexString(extension.makingAmountData)
        makingIter.nextAddress()

        const auctionDetails = EscrowExtension.decodeAuctionDetailsV1(
            makingIter.rest()
        )

        const complement =
            extension.customData === ZX
                ? AddressComplement.ZERO
                : new AddressComplement(BigInt(extension.customData))

        return new EscrowExtension(
            factory,
            auctionDetails,
            whitelist,
            crossChainData.hashLock,
            crossChainData.dstChainId,
            crossChainData.dstToken,
            crossChainData.srcSafetyDeposit,
            crossChainData.dstSafetyDeposit,
            crossChainData.timeLocks,
            complement
        )
    }

    private static decodeAuctionDetailsV1(data: string): AuctionDetails {
        const iter = BytesIter.BigInt(data)

        const gasBumpEstimate = iter.nextUint24()
        const gasPriceEstimate = iter.nextUint32()
        const startTime = iter.nextUint32()
        const duration = iter.nextUint24()
        const initialRateBump = Number(iter.nextUint24())

        const points: AuctionPoint[] = []

        while (!iter.isEmpty()) {
            points.push({
                coefficient: Number(iter.nextUint24()),
                delay: Number(iter.nextUint16())
            })
        }

        return new AuctionDetails({
            startTime,
            duration,
            initialRateBump,
            points,
            gasCost: {gasBumpEstimate, gasPriceEstimate}
        })
    }

    private static decodeWhitelistV1(data: string): Whitelist {
        const iter = BytesIter.BigInt(data)

        iter.nextUint8(BytesIter.SIDE.Back)

        const resolvingStartTime = iter.nextUint32()

        const whitelist: {address: Address; allowFrom: bigint}[] = []
        let allowFrom = resolvingStartTime

        while (!iter.isEmpty()) {
            const addressHalf = iter.nextBytes(10)
            const delay = iter.nextUint16()

            allowFrom += delay
            whitelist.push({
                address: Address.fromBigInt(addressHalf),
                allowFrom
            })
        }

        return Whitelist.new(resolvingStartTime, whitelist)
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
            dstSafetyDeposit: safetyDepositBN.getMask(new BitMask(0n, 128n))
                .value,
            srcSafetyDeposit: safetyDepositBN.getMask(new BitMask(128n, 256n))
                .value,
            timeLocks: TimeLocks.fromBigInt(timeLocks)
        }
    }

    /**
     * Build extension
     */
    override build(): Extension {
        const baseExt = super.build()

        const iter = BytesIter.HexString(baseExt.postInteraction)
        const callback = iter.nextAddress()
        const flags = new BN(BigInt(iter.nextUint8()))
        const integrator = iter.nextAddress()
        const protocol = iter.nextAddress()

        // Skip custom receiver if present
        if (flags.getBit(0n)) {
            iter.nextAddress()
        }

        const restBytes = (iter.rest().length - 2) / 2
        const feeAndWhitelistLength = restBytes - 33 // surplus bytes
        const feeAndWhitelist = iter.nextBytes(feeAndWhitelistLength)

        const postInteraction = new BytesBuilder()
            .addAddress(callback)
            .addAddress(integrator)
            .addAddress(protocol)
            .addBytes(feeAndWhitelist)
            .addBytes(this.encodeCrossChainData())
            .asHex()

        return new Extension({
            ...baseExt,
            postInteraction,
            customData: this.encodeCustomData()
        })
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
