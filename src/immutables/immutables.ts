import {Address} from '@1inch/fusion-sdk'
import {AbiCoder, keccak256} from 'ethers'
import {isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'
import {DstImmutablesComplement} from './dst-immutables-complement'
import {HashLock} from '../cross-chain-order/hash-lock'
import {TimeLocks} from '../cross-chain-order/time-locks'

/**
 * Contract representation of class
 */
export type ImmutablesData = {
    orderHash: string
    hashlock: string
    maker: string
    taker: string
    token: string
    amount: string
    safetyDeposit: string
    timelocks: string
}

/**
 * Contains escrow params for both source and destination chains
 * Determinate addresses of escrow contracts
 */
export class Immutables {
    public static readonly Web3Type = `tuple(${[
        'bytes32 orderHash',
        'bytes32 hashlock',
        'address maker',
        'address taker',
        'address token',
        'uint256 amount',
        'uint256 safetyDeposit',
        'uint256 timelocks'
    ]})`

    private constructor(
        public readonly orderHash: string,
        public readonly hashLock: HashLock,
        public readonly maker: Address,
        /**
         * Address who can withdraw funds, also to this address funds will be transferred in case of public withdrawal
         */
        public readonly taker: Address,
        public readonly token: Address,
        public readonly amount: bigint,
        public readonly safetyDeposit: bigint,
        public readonly timeLocks: TimeLocks
    ) {
        if (this.token.isZero()) {
            this.token = Address.NATIVE_CURRENCY
        }
    }

    public static new(params: {
        orderHash: string
        hashLock: HashLock
        maker: Address
        taker: Address
        token: Address
        amount: bigint
        safetyDeposit: bigint
        timeLocks: TimeLocks
    }): Immutables {
        return new Immutables(
            params.orderHash,
            params.hashLock,
            params.maker,
            params.taker,
            params.token,
            params.amount,
            params.safetyDeposit,
            params.timeLocks
        )
    }

    /**
     * Create instance from encoded bytes
     * @param bytes 0x prefixed hex string
     */
    public static decode(bytes: string): Immutables {
        assert(isHexBytes(bytes))
        const res = AbiCoder.defaultAbiCoder().decode(
            [Immutables.Web3Type],
            bytes
        )
        const data = res.at(0) as ImmutablesData

        return new Immutables(
            data.orderHash,
            HashLock.fromString(data.hashlock),
            new Address(data.maker),
            new Address(data.taker),
            new Address(data.token),
            BigInt(data.amount),
            BigInt(data.safetyDeposit),
            TimeLocks.fromBigInt(BigInt(data.timelocks))
        )
    }

    public toJSON(): ImmutablesData {
        return this.build()
    }

    public withComplement(dstComplement: DstImmutablesComplement): Immutables {
        return Immutables.new({...this, ...dstComplement})
    }

    public withDeployedAt(time: bigint): Immutables {
        return Immutables.new({
            ...this,
            timeLocks: TimeLocks.fromBigInt(
                this.timeLocks.build()
            ).setDeployedAt(time)
        })
    }

    public withTaker(taker: Address): Immutables {
        return Immutables.new({...this, taker})
    }

    public withHashLock(hashLock: HashLock): Immutables {
        return Immutables.new({...this, hashLock})
    }

    public withAmount(amount: bigint): Immutables {
        return Immutables.new({...this, amount})
    }

    /**
     * Return keccak256 hash of instance
     */
    public hash(): string {
        return keccak256(this.encode())
    }

    public build(): ImmutablesData {
        const token = this.token.isNative() ? Address.ZERO_ADDRESS : this.token

        return {
            orderHash: this.orderHash,
            hashlock: this.hashLock.toString(),
            maker: this.maker.toString(),
            taker: this.taker.toString(),
            token: token.toString(),
            amount: this.amount.toString(),
            safetyDeposit: this.safetyDeposit.toString(),
            timelocks: this.timeLocks.build().toString()
        }
    }

    /**
     * Encode instance as bytes
     */
    public encode(): string {
        return AbiCoder.defaultAbiCoder().encode(
            [Immutables.Web3Type],
            [this.build()]
        )
    }
}
