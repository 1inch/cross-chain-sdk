import {AbiCoder, keccak256} from 'ethers'
import {isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'
import {DstImmutablesComplement} from './dst-immutables-complement'
import {HashLock} from '../hash-lock'
import {TimeLocks} from '../time-locks'
import {AddressLike, EvmAddress} from '../../domains/addresses'

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
        public readonly maker: AddressLike,
        /**
         * Address who can withdraw funds, also to this address funds will be transferred in case of public withdrawal
         */
        public readonly taker: AddressLike,
        public readonly token: AddressLike,
        public readonly amount: bigint,
        public readonly safetyDeposit: bigint,
        public readonly timeLocks: TimeLocks
    ) {
        this.token = this.token.zeroAsNative()
    }

    public static new(params: {
        orderHash: string
        hashLock: HashLock
        maker: AddressLike
        taker: AddressLike
        token: AddressLike
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
    public static fromABIEncoded(bytes: string): Immutables {
        assert(isHexBytes(bytes))
        const res = AbiCoder.defaultAbiCoder().decode(
            [Immutables.Web3Type],
            bytes
        )
        const data = res.at(0) as ImmutablesData

        return new Immutables(
            data.orderHash,
            HashLock.fromString(data.hashlock),
            new EvmAddress(data.maker),
            new EvmAddress(data.taker),
            new EvmAddress(data.token),
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

    public withTaker(taker: AddressLike): Immutables {
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
        return keccak256(this.toABIEncoded())
    }

    public build(): ImmutablesData {
        const token = this.token.nativeAsZero()

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
    public toABIEncoded(): string {
        return AbiCoder.defaultAbiCoder().encode(
            [Immutables.Web3Type],
            [this.build()]
        )
    }
}
