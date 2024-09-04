import {
    Address,
    Extension,
    FusionExtension,
    Interaction,
    SettlementPostInteractionData,
    AuctionDetails,
    NetworkEnum
} from '@1inch/fusion-sdk'
import {AbiCoder} from 'ethers'
import {BitMask, BN, trim0x, UINT_128_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {TimeLocks} from './time-locks/time-locks'
import {HashLock} from './hash-lock/hash-lock'

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
        public readonly dstChainId: NetworkEnum,
        public readonly dstToken: Address,
        public readonly srcSafetyDeposit: bigint,
        public readonly dstSafetyDeposit: bigint,
        public readonly timeLocks: TimeLocks
    ) {
        assert(srcSafetyDeposit <= UINT_128_MAX)
        assert(srcSafetyDeposit <= UINT_128_MAX)

        super(address, auctionDetails, postInteractionData, makerPermit)

        if (this.dstToken.isZero()) {
            this.dstToken = Address.NATIVE_CURRENCY
        }
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
            dstToken: new Address(dstToken),
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
        const dstToken = this.dstToken.isNative()
            ? Address.ZERO_ADDRESS
            : this.dstToken

        return AbiCoder.defaultAbiCoder().encode(
            EscrowExtension.EXTRA_DATA_TYPES,
            [
                this.hashLockInfo.toString(),
                this.dstChainId,
                dstToken.toString(),
                (this.srcSafetyDeposit << 128n) | this.dstSafetyDeposit,
                this.timeLocks.build()
            ]
        )
    }
}
