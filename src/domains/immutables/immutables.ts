import {AbiCoder, keccak256} from 'ethers'
import {add0x, isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'
import {DstImmutablesComplement} from './dst-immutables-complement'
import {HashLock} from '../hash-lock'
import {TimeLocks} from '../time-locks'
import {AddressLike, EvmAddress, SolanaAddress} from '../../domains/addresses'
import {bufferFromHex} from '../../utils/bytes'

/**
 * Contract representation of class
 */
export type ImmutablesData = {
    /**
     * hex encoded with 0x prefix
     */
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
export class Immutables<A extends AddressLike = AddressLike> {
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
        public readonly orderHash: Buffer,
        public readonly hashLock: HashLock,
        public readonly maker: A,
        /**
         * Address who can withdraw funds, also to this address funds will be transferred in case of public withdrawal
         */
        public readonly taker: A,
        public readonly token: A,
        public readonly amount: bigint,
        public readonly safetyDeposit: bigint,
        public readonly timeLocks: TimeLocks
    ) {
        this.token = this.token.zeroAsNative() as A
    }

    public static new<A extends AddressLike>(params: {
        orderHash: Buffer
        hashLock: HashLock
        maker: A
        taker: A
        token: A
        amount: bigint
        safetyDeposit: bigint
        timeLocks: TimeLocks
    }): Immutables<A> {
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
    public static fromABIEncoded(bytes: string): Immutables<EvmAddress> {
        assert(isHexBytes(bytes))
        const res = AbiCoder.defaultAbiCoder().decode(
            [Immutables.Web3Type],
            bytes
        )
        const data = res.at(0) as ImmutablesData

        return Immutables.fromJSON(data) as Immutables<EvmAddress>
    }

    public static fromJSON<T extends AddressLike = AddressLike>(
        data: ImmutablesData
    ): Immutables<T> {
        const isSolanaAddress = data.maker.length === 66
        const isEvmAddress = data.maker.length === 42
        assert(isSolanaAddress || isEvmAddress, 'invalid addresses length')

        if (isSolanaAddress) {
            assert(data.taker.length === 66, 'invalid solana taker address len')
            assert(data.token.length === 66, 'invalid solana token address len')
        }

        if (isEvmAddress) {
            assert(data.taker.length === 42, 'invalid solana taker address len')
            assert(data.token.length === 42, 'invalid solana token address len')
        }

        const TypedAddress = isSolanaAddress ? SolanaAddress : EvmAddress

        return new Immutables(
            bufferFromHex(data.orderHash),
            HashLock.fromString(data.hashlock),
            TypedAddress.fromBuffer(bufferFromHex(data.maker)),
            TypedAddress.fromBuffer(bufferFromHex(data.taker)),
            TypedAddress.fromBuffer(bufferFromHex(data.token)),
            BigInt(data.amount),
            BigInt(data.safetyDeposit),
            TimeLocks.fromBigInt(BigInt(data.timelocks))
        ) as unknown as Immutables<T>
    }

    public toJSON(): ImmutablesData {
        return this.build()
    }

    public withComplement<D extends AddressLike>(
        dstComplement: DstImmutablesComplement<D>
    ): Immutables<D> {
        return Immutables.new({...this, ...dstComplement})
    }

    public withDeployedAt(time: bigint): Immutables<A> {
        return Immutables.new({
            ...this,
            timeLocks: TimeLocks.fromBigInt(
                this.timeLocks.build()
            ).setDeployedAt(time)
        })
    }

    public withTaker(taker: A): Immutables<A> {
        return Immutables.new({...this, taker})
    }

    public withHashLock(hashLock: HashLock): Immutables<A> {
        return Immutables.new({...this, hashLock})
    }

    public withAmount(amount: bigint): Immutables<A> {
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
            orderHash: add0x(this.orderHash.toString('hex')),
            hashlock: this.hashLock.toString(),
            maker: this.maker.toHex(),
            taker: this.taker.toHex(),
            token: token.toHex(),
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
