import {Address} from '@1inch/fusion-sdk'
import {AbiCoder, getCreate2Address, keccak256} from 'ethers'
import {isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {HashLock} from '../hash-lock'
import {TimeLocks} from '../time-locks/time-locks'
import {
    ESCROW_DST_IMPLEMENTATION_ADDRESS,
    ESCROW_FACTORY_ADDRESS,
    ESCROW_SRC_IMPLEMENTATION_ADDRESS
} from '../contants'

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
        public readonly taker: Address,
        public readonly takerAsset: Address,
        public readonly takerAmount: bigint,
        public readonly safetyDeposit: bigint, // todo: separate class
        public readonly timeLocks: TimeLocks
    ) {}

    public static new(params: {
        orderHash: string
        hashLock: HashLock
        maker: Address
        taker: Address
        takerAsset: Address
        takerAmount: bigint
        safetyDeposit: bigint
        timeLocks: TimeLocks
    }): Immutables {
        return new Immutables(
            params.orderHash,
            params.hashLock,
            params.maker,
            params.taker,
            params.takerAsset,
            params.takerAmount,
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

    /**
     * See https://github.com/1inch/cross-chain-swap/blob/03d99b9604d8f7a5a396720fbe1059f7d94db762/contracts/libraries/ProxyHashLib.sol#L14
     */
    private static calcProxyBytecodeHash(impl: Address): string {
        return keccak256(
            `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${trim0x(impl.toString())}5af43d82803e903d91602b57fd5bf3`
        )
    }

    /**
     * Return keccak256 hash of instance
     */
    public hash(): string {
        return keccak256(this.encode())
    }

    public build(): ImmutablesData {
        return {
            orderHash: this.orderHash,
            hashlock: this.hashLock.toString(),
            maker: this.maker.toString(),
            taker: this.taker.toString(),
            token: this.takerAsset.toString(),
            amount: this.takerAmount.toString(),
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

    /**
     * Calculate address of source escrow contract (source chain)
     */
    public getSrcEscrowAddress(
        factory = ESCROW_FACTORY_ADDRESS,
        srcImplementation = ESCROW_SRC_IMPLEMENTATION_ADDRESS
    ): Address {
        return new Address(
            getCreate2Address(
                factory.toString(),
                this.hash(),
                Immutables.calcProxyBytecodeHash(srcImplementation)
            )
        )
    }

    /**
     * Calculate address of destination escrow contract (destination chain)
     */
    public getDstEscrowAddress(
        factory = ESCROW_FACTORY_ADDRESS,
        dstImplementation = ESCROW_DST_IMPLEMENTATION_ADDRESS
    ): Address {
        return new Address(
            getCreate2Address(
                factory.toString(),
                this.hash(),
                Immutables.calcProxyBytecodeHash(dstImplementation)
            )
        )
    }
}
