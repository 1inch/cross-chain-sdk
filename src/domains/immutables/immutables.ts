import {AbiCoder, keccak256} from 'ethers'
import {add0x, isHexBytes} from '@1inch/byte-utils'
import {ZX} from '@1inch/fusion-sdk'
import assert from 'assert'
import {DstImmutablesComplement} from './dst-immutables-complement.js'
import {ImmutablesData} from './types.js'
import {HashLock} from '../hash-lock/index.js'
import {TimeLocks} from '../time-locks/index.js'
import {ImmutablesFees} from '../immutables-fees/index.js'
import {
    AddressLike,
    EvmAddress,
    SolanaAddress
} from '../../domains/addresses/index.js'
import {bufferFromHex} from '../../utils/bytes.js'

/**
 * Contains escrow params for both source and destination chains.
 * Determines addresses of escrow contracts.
 */
export class Immutables<A extends AddressLike = AddressLike> {
    static readonly Web3Type = `tuple(${[
        'bytes32 orderHash',
        'bytes32 hashlock',
        'address maker',
        'address taker',
        'address token',
        'uint256 amount',
        'uint256 safetyDeposit',
        'uint256 timelocks',
        'bytes parameters'
    ]})`

    private constructor(
        public readonly orderHash: Buffer,
        public readonly hashLock: HashLock,
        public readonly maker: A,
        public readonly taker: A,
        public readonly token: A,
        public readonly amount: bigint,
        public readonly safetyDeposit: bigint,
        public readonly timeLocks: TimeLocks,
        public readonly fees?: ImmutablesFees
    ) {
        this.token = this.token.zeroAsNative() as A
    }

    static new<A extends AddressLike>({
        orderHash,
        hashLock,
        maker,
        taker,
        token,
        amount,
        safetyDeposit,
        timeLocks,
        fees
    }: {
        orderHash: Buffer
        hashLock: HashLock
        maker: A
        taker: A
        token: A
        amount: bigint
        safetyDeposit: bigint
        timeLocks: TimeLocks
        fees?: ImmutablesFees
    }): Immutables<A> {
        return new Immutables(
            orderHash,
            hashLock,
            maker,
            taker,
            token,
            amount,
            safetyDeposit,
            timeLocks,
            fees
        )
    }

    static fromABIEncoded(bytes: string): Immutables<EvmAddress> {
        assert(isHexBytes(bytes), 'Invalid hex bytes')
        const result = AbiCoder.defaultAbiCoder().decode(
            [Immutables.Web3Type],
            bytes
        )
        const data = result[0] as ImmutablesData

        return Immutables.fromJSON(data) as Immutables<EvmAddress>
    }

    static fromJSON<T extends AddressLike = AddressLike>(
        data: ImmutablesData
    ): Immutables<T> {
        const isSolanaAddress = data.maker.length === 66
        const isEvmAddress = data.maker.length === 42
        assert(isSolanaAddress || isEvmAddress, 'invalid address length')

        if (isSolanaAddress) {
            assert(
                data.taker.length === 66,
                'Invalid Solana taker address length'
            )
            assert(
                data.token.length === 66,
                'Invalid Solana token address length'
            )
        }

        if (isEvmAddress) {
            assert(data.taker.length === 42, 'Invalid EVM taker address length')
            assert(data.token.length === 42, 'Invalid EVM token address length')
        }

        const TypedAddress = isSolanaAddress ? SolanaAddress : EvmAddress

        const fees =
            data.parameters && data.parameters !== ZX
                ? ImmutablesFees.decode(data.parameters)
                : undefined

        return new Immutables(
            bufferFromHex(data.orderHash),
            HashLock.fromString(data.hashlock),
            TypedAddress.fromBuffer(bufferFromHex(data.maker)),
            TypedAddress.fromBuffer(bufferFromHex(data.taker)),
            TypedAddress.fromBuffer(bufferFromHex(data.token)),
            BigInt(data.amount),
            BigInt(data.safetyDeposit),
            TimeLocks.fromBigInt(BigInt(data.timelocks)),
            fees
        ) as unknown as Immutables<T>
    }

    toJSON(): ImmutablesData {
        return this.build()
    }

    /**
     * Create DST immutables from SRC immutables with complement data.
     */
    withComplement<D extends AddressLike>(
        dstComplement: DstImmutablesComplement<D>
    ): Immutables<D> {
        return Immutables.new({
            orderHash: this.orderHash,
            hashLock: this.hashLock,
            maker: dstComplement.maker,
            taker: dstComplement.taker,
            token: dstComplement.token,
            amount: dstComplement.amount,
            safetyDeposit: dstComplement.safetyDeposit,
            timeLocks: this.timeLocks,
            fees: dstComplement.fees
        })
    }

    public withDeployedAt(time: bigint): Immutables<A> {
        return Immutables.new({
            ...this,
            timeLocks: TimeLocks.fromBigInt(
                this.timeLocks.build()
            ).setDeployedAt(time)
        })
    }

    withTaker(taker: A): Immutables<A> {
        return Immutables.new({...this, taker})
    }

    withHashLock(hashLock: HashLock): Immutables<A> {
        return Immutables.new({...this, hashLock})
    }

    withAmount(amount: bigint): Immutables<A> {
        return Immutables.new({...this, amount})
    }

    withFees(fees: ImmutablesFees): Immutables<A> {
        return Immutables.new({...this, fees})
    }

    /**
     * Compute hash matching the contract's ImmutablesLib.hash().
     */
    hash(): string {
        const coder = AbiCoder.defaultAbiCoder()
        const parametersHash = keccak256(this.encodeParameters())

        const encoded = coder.encode(
            [
                'bytes32',
                'bytes32',
                'address',
                'address',
                'address',
                'uint256',
                'uint256',
                'uint256',
                'bytes32'
            ],
            [
                add0x(this.orderHash.toString('hex')),
                this.hashLock.toString(),
                this.maker.toHex(),
                this.taker.toHex(),
                this.token.nativeAsZero().toHex(),
                this.amount,
                this.safetyDeposit,
                this.timeLocks.build(),
                parametersHash
            ]
        )

        return keccak256(encoded)
    }

    /**
     * Build immutables data for contract calls.
     */
    build(): ImmutablesData {
        return {
            orderHash: add0x(this.orderHash.toString('hex')),
            hashlock: this.hashLock.toString(),
            maker: this.maker.toHex(),
            taker: this.taker.toHex(),
            token: this.token.nativeAsZero().toHex(),
            amount: this.amount.toString(),
            safetyDeposit: this.safetyDeposit.toString(),
            timelocks: this.timeLocks.build().toString(),
            parameters: this.encodeParameters()
        }
    }

    toABIEncoded(): string {
        return AbiCoder.defaultAbiCoder().encode(
            [Immutables.Web3Type],
            [this.build()]
        )
    }

    /**
     * Encode fees for contract calls.
     * Returns '0x' if fees not set, otherwise encoded fees.
     */
    private encodeParameters(): string {
        return this.fees ? this.fees.encode() : ZX
    }
}
