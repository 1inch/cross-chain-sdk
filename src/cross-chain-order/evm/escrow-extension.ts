import {AbiCoder} from 'ethers'
import {BitMask, BN, trim0x, UINT_128_MAX} from '@1inch/byte-utils'
import {Extension, Interaction} from '@1inch/limit-order-sdk'
import assert from 'assert'
import {FusionExtension, SettlementPostInteractionData} from './fusion-order'
import {AuctionDetails} from '../../domains/auction-details'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {SupportedChain} from '../../chains'
import {AddressLike, EvmAddress as Address} from '../../domains/addresses'

/**
 * Same as FusionExtension, but with extra data at the end
 * Extra data contains next fields:
 * - hashLock
 * - dstChainId
 * - dstToken
 * - srcSafetyDeposit
 * - dstSafetyDeposit
 * - timeLocks
 */
export class EscrowExtension extends FusionExtension {
    private static EXTRA_DATA_TYPES = [
        HashLock.Web3Type,
        'uint256', // dst chain id
        'address', // dst token
        'uint256', // src/dst safety deposit
        TimeLocks.Web3Type
    ] as const

    private static EXTRA_DATA_LENGTH = 160 * 2 // 160 bytes, so 320 hex chars

    constructor(
        address: Address,
        auctionDetails: AuctionDetails,
        postInteractionData: SettlementPostInteractionData,
        makerPermit: Interaction | undefined,
        public readonly hashLockInfo: HashLock,
        public readonly dstChainId: SupportedChain,
        public readonly dstToken: AddressLike,
        public readonly srcSafetyDeposit: bigint,
        public readonly dstSafetyDeposit: bigint,
        public readonly timeLocks: TimeLocks
    ) {
        assert(srcSafetyDeposit <= UINT_128_MAX)
        assert(srcSafetyDeposit <= UINT_128_MAX)

        super(address, auctionDetails, postInteractionData, makerPermit)

        this.dstToken = dstToken.zeroAsNative()
    }

    /**
     * Create EscrowExtension from bytes
     * @param bytes 0x prefixed bytes
     */
    public static decode(bytes: string): EscrowExtension {
        const extension = Extension.decode(bytes)

        return EscrowExtension.fromExtension(extension)
    }

    public static fromExtension(extension: Extension): EscrowExtension {
        const fusionExt = FusionExtension.fromExtension(
            new Extension({
                ...extension,
                postInteraction: extension.postInteraction.slice(
                    0,
                    -EscrowExtension.EXTRA_DATA_LENGTH
                )
            })
        )

        const extra = EscrowExtension.decodeExtraData(
            '0x' +
                extension.postInteraction.slice(
                    -EscrowExtension.EXTRA_DATA_LENGTH
                )
        )

        return new EscrowExtension(
            fusionExt.address,
            fusionExt.auctionDetails,
            fusionExt.postInteractionData,
            fusionExt.makerPermit,
            extra.hashLock,
            extra.dstChainId,
            extra.dstToken,
            extra.srcSafetyDeposit,
            extra.dstSafetyDeposit,
            extra.timeLocks
        )
    }

    /**
     * Decode escrow data not related to fusion
     *
     * @param bytes 0x prefixed bytes
     */
    private static decodeExtraData(bytes: string): {
        hashLock: HashLock
        dstChainId: number
        dstToken: Address
        srcSafetyDeposit: bigint
        dstSafetyDeposit: bigint
        timeLocks: TimeLocks
    } {
        const [hashLock, dstChainId, dstToken, safetyDeposit, timeLocks] =
            AbiCoder.defaultAbiCoder().decode(
                EscrowExtension.EXTRA_DATA_TYPES,
                bytes
            )

        const safetyDepositBN = new BN(safetyDeposit)

        return {
            hashLock: HashLock.fromString(hashLock),
            dstChainId: Number(dstChainId),
            dstToken: Address.fromString(dstToken),
            dstSafetyDeposit: safetyDepositBN.getMask(new BitMask(0n, 128n))
                .value,
            srcSafetyDeposit: safetyDepositBN.getMask(new BitMask(128n, 256n))
                .value,
            timeLocks: TimeLocks.fromBigInt(timeLocks)
        }
    }

    public build(): Extension {
        const baseExt = super.build()

        return new Extension({
            ...baseExt,
            postInteraction:
                baseExt.postInteraction + trim0x(this.encodeExtraData())
        })
    }

    private encodeExtraData(): string {
        return AbiCoder.defaultAbiCoder().encode(
            EscrowExtension.EXTRA_DATA_TYPES,
            [
                this.hashLockInfo.toString(),
                this.dstChainId,
                this.dstToken.nativeAsZero().toHex(),
                (this.srcSafetyDeposit << 128n) | this.dstSafetyDeposit,
                this.timeLocks.build()
            ]
        )
    }
}
