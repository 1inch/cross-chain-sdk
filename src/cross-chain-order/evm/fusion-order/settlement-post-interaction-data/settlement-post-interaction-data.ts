import {Address, Extension} from '@1inch/limit-order-sdk'
import {
    add0x,
    BitMask,
    BN,
    BytesBuilder,
    BytesIter,
    isHexBytes,
    UINT_16_MAX
} from '@1inch/byte-utils'
import assert from 'assert'
import {IntegratorFee, SettlementSuffixData} from './types'
import {now} from '../../../../utils/time'

export class SettlementPostInteractionData {
    public readonly whitelist: WhitelistItem[]

    public readonly resolvingStartTime: bigint

    private constructor(data: {
        whitelist: WhitelistItem[]
        integratorFee?: IntegratorFee
        resolvingStartTime: bigint
        customReceiver?: Address
    }) {
        this.whitelist = data.whitelist
        this.resolvingStartTime = data.resolvingStartTime
    }

    static new(data: SettlementSuffixData): SettlementPostInteractionData {
        assert(data.whitelist.length, 'Whitelist can not be empty')

        // transform timestamps to cumulative delays
        let sumDelay = 0n
        const whitelist = data.whitelist
            .map((d) => ({
                addressHalf: d.address.toString().slice(-20),
                allowFrom:
                    d.allowFrom < data.resolvingStartTime
                        ? data.resolvingStartTime
                        : d.allowFrom
            }))
            .sort((a, b) => Number(a.allowFrom - b.allowFrom)) // ASC
            .map((val) => {
                const delay = val.allowFrom - data.resolvingStartTime - sumDelay
                sumDelay += delay

                assert(delay < UINT_16_MAX, 'Too big diff between timestamps')

                return {
                    delay,
                    addressHalf: val.addressHalf
                }
            })

        return new SettlementPostInteractionData({
            ...data,
            whitelist
        })
    }

    /**
     * Construct `SettlementPostInteractionData` from bytes
     * @param data bytes with 0x prefix in next format:
     * - [uint32 feeBank] only when first bit of `bitMask` enabled
     * - [uint16 integratorFeeRation, uint160 integratorFeeReceiver, [uint160 customReceiver]] only when second bit of `bitMask` enabled
     * - uint32 auctionStartTime
     * - (bytes10 last10bytesOfAddress, uint16 auctionDelay) * N whitelist info
     * - uint8 bitMask:
     *                  0b0000_0001 - fee bank mask
     *                  0b0000_0010 - integrator fee mask
     *                  0b0000_0100 - is custom receiver present (only used when integrator fee enabled)
     *                  0b1111_1000 - resolvers count mask
     *
     * All data is tight packed
     * @see SettlementPostInteractionData.encode
     */
    static decode(data: string): SettlementPostInteractionData {
        assert(
            isHexBytes(data),
            'Post interaction data must be valid bytes string'
        )

        const iter = BytesIter.BigInt(data)
        iter.nextByte(BytesIter.SIDE.Back) // skip flags, we do not parse fees data

        const resolvingStartTime = iter.nextUint32()

        const whitelist = [] as WhitelistItem[]

        while (!iter.isEmpty()) {
            const addressHalf = iter
                .nextBytes(10)
                .toString(16)
                .padStart(20, '0')
            const delay = iter.nextUint16()

            whitelist.push({
                addressHalf,
                delay
            })
        }

        return new SettlementPostInteractionData({
            resolvingStartTime,
            whitelist
        })
    }

    static fromExtension(extension: Extension): SettlementPostInteractionData {
        return SettlementPostInteractionData.decode(
            add0x(extension.postInteraction.slice(42))
        )
    }

    /**
     * Serialize post-interaction data to bytes
     */
    public encode(): string {
        /**
         * 0b0000_0001 - fee bank mask
         * 0b0000_0010 - integrator fee mask
         * 0b0000_0100 - is custom receiver present
         * 0b1111_1000 - resolvers count mask
         */
        let bitMask = new BN(0n)

        const bytes = new BytesBuilder()

        bytes.addUint32(this.resolvingStartTime)

        // whitelist data
        for (const wl of this.whitelist) {
            bytes.addBytes(add0x(wl.addressHalf)).addUint16(wl.delay)
        }

        bitMask = bitMask.setMask(
            new BitMask(3n, 8n),
            BigInt(this.whitelist.length)
        )

        bytes.addUint8(bitMask.value)

        return bytes.asHex()
    }

    /**
     * Check whether address allowed to execute order at the given time
     *
     * @param executor address of executor
     * @param executionTime timestamp in sec at which order planning to execute
     */
    public canExecuteAt(executor: Address, executionTime: bigint): boolean {
        const addressHalf = executor.toString().slice(-20)

        let allowedFrom = this.resolvingStartTime

        for (const whitelist of this.whitelist) {
            allowedFrom += whitelist.delay

            if (addressHalf === whitelist.addressHalf) {
                return executionTime >= allowedFrom
            } else if (executionTime < allowedFrom) {
                return false
            }
        }

        return false
    }

    public isExclusivityPeriod(time = now()): boolean {
        if (this.whitelist.length === 1) {
            return true
        }

        if (this.whitelist[0].delay === this.whitelist[1].delay) {
            return false
        }

        return time <= this.resolvingStartTime + this.whitelist[1].delay
    }

    public isExclusiveResolver(wallet: Address): boolean {
        const addressHalf = wallet.toString().slice(-20)

        // only one resolver, so check if it is the passed address
        if (this.whitelist.length === 1) {
            return addressHalf === this.whitelist[0].addressHalf
        }

        // more than 1 address can fill at the same time, no exclusivity
        if (this.whitelist[0].delay === this.whitelist[1].delay) {
            return false
        }

        return addressHalf === this.whitelist[0].addressHalf
    }
}

type WhitelistItem = {
    /**
     * last 10 bytes of address, no 0x prefix
     */
    addressHalf: string
    /**
     * Delay from previous resolver in seconds
     * For first resolver delay from `resolvingStartTime`
     */
    delay: bigint
}
