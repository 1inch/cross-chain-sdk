import {AbiCoder} from 'ethers'
import {BitMask, BN, trim0x, UINT_128_MAX} from '@1inch/byte-utils'
import {
    FusionExtension,
    Extension,
    Interaction,
    Whitelist,
    SurplusParams,
    Fees,
    ZX,
    Address
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

export type EscrowExtensionExtra = {
    makerPermit?: Interaction
    customReceiver?: Address
    fees?: Fees
}

const SURPLUS_BYTES_LENGTH = 66 // 33 bytes = 66 hex chars
const ZERO_SURPLUS = '0'.repeat(SURPLUS_BYTES_LENGTH)

/**
 * Extension for cross-chain escrow orders.
 *
 * Extends FusionExtension and adapts it by:
 * - Stripping surplus bytes (33 bytes) that cross-chain doesn't need
 * - Appending cross-chain specific data (160 bytes)
 */
export class EscrowExtension extends FusionExtension {
    private static readonly CROSS_CHAIN_DATA_TYPES = [
        HashLock.Web3Type,
        'uint256', // dst chain id
        'uint256', // dst token
        'uint256', // src/dst safety deposit packed
        TimeLocks.Web3Type
    ] as const

    private static readonly CROSS_CHAIN_DATA_LENGTH = 320 // 160 bytes = 320 hex chars

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

    static decode(bytes: string): EscrowExtension {
        return EscrowExtension.fromExtension(Extension.decode(bytes))
    }

    /**
     * Create EscrowExtension from Extension (cross-chain format without surplus).
     */
    static fromExtension(extension: Extension): EscrowExtension {
        const crossChainData = EscrowExtension.decodeCrossChainData(
            '0x' +
                extension.postInteraction.slice(
                    -EscrowExtension.CROSS_CHAIN_DATA_LENGTH
                )
        )

        // Add fake surplus (zeros) so FusionExtension.fromExtension can decode
        const postInteractionForFusion =
            extension.postInteraction.slice(
                0,
                -EscrowExtension.CROSS_CHAIN_DATA_LENGTH
            ) + ZERO_SURPLUS

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
            {
                makerPermit: fusionExt.extra?.makerPermit,
                customReceiver: fusionExt.extra?.customReceiver,
                fees: fusionExt.extra?.fees
            }
        )
    }

    /**
     * Build extension: let Fusion build, strip surplus, add cross-chain data.
     */
    override build(): Extension {
        const baseExt = super.build()

        // Strip surplus (33 bytes) from end, append cross-chain data
        const postInteractionWithoutSurplus = baseExt.postInteraction.slice(
            0,
            -SURPLUS_BYTES_LENGTH
        )

        return new Extension({
            ...baseExt,
            postInteraction:
                postInteractionWithoutSurplus +
                trim0x(this.encodeCrossChainData()),
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
            AbiCoder.defaultAbiCoder().decode(
                EscrowExtension.CROSS_CHAIN_DATA_TYPES,
                bytes
            )

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

    private encodeCrossChainData(): string {
        const packedSafetyDeposit =
            (this.srcSafetyDeposit << 128n) | this.dstSafetyDeposit

        return AbiCoder.defaultAbiCoder().encode(
            EscrowExtension.CROSS_CHAIN_DATA_TYPES,
            [
                this.hashLockInfo.toString(),
                this.dstChainId,
                this.dstToken.nativeAsZero().toHex(),
                packedSafetyDeposit,
                this.timeLocks.build()
            ]
        )
    }

    private encodeCustomData(): string {
        if (!this.dstAddressFirstPart || this.dstAddressFirstPart.isZero()) {
            return ZX
        }

        return this.dstAddressFirstPart.asHex()
    }
}
