import {keccak256} from 'ethers'
import {EscrowFactory} from './escrow-factory.js'
import {EvmAddress as Address} from '../../domains/addresses/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {ImmutableFees} from '../../domains/immutables-fees/index.js'
import {
    DstImmutablesComplement,
    Immutables
} from '../../domains/immutables/index.js'

describe('EscrowFactory', () => {
    it('Should correct calc src/dst address for Ethereum', () => {
        const factory = new EscrowFactory(Address.fromBigInt(1n))
        const immutablesHash = keccak256('0x')
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = factory.getEscrowAddress(
            immutablesHash,
            srcImplAddress
        )
        const dstAddress = factory.getEscrowAddress(
            immutablesHash,
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            Address.fromString('0x2f8f065e797ad5499066c0e7d1f8f1c0405e3179')
        )

        expect(dstAddress).toEqual(
            Address.fromString('0x291200ceb5fab3847c9f30c5f272961f78d6cfd4')
        )
    })

    it('Should correct calc src/dst address for Ethereum 2', () => {
        const factory = new EscrowFactory(Address.fromBigInt(1n))

        const immutables = Immutables.new({
            maker: Address.fromString(
                '0x04d3b2c70208f3fb196affef78080b3cc05ee1cb'
            ),
            taker: Address.fromString(
                '0x9c4dffb4f7e8217a8ac0555d67e125f8769284ba'
            ),
            token: Address.fromString(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ),
            amount: 99345341n,
            hashLock: HashLock.fromString(
                '0x939dbeb956ac9369de8b1acaaa78a173620c2275fba501f8340b91cbceabdbf1'
            ),
            orderHash: Buffer.from(
                '8ed7de0668228e00103038a7fc6a19c933d56fca27b154a3e532ebeb4a5c07bd',
                'hex'
            ),
            timeLocks:
                TimeLocks.fromBigInt(
                    46545443980783778519496226194286874737220106048808714334632784681655911579684n
                ),
            safetyDeposit: 2474844692460000n,
            fees: ImmutableFees.ZERO
        })
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = factory.getSrcEscrowAddress(
            immutables,
            srcImplAddress
        )
        const dstAddress = factory.getDstEscrowAddress(
            immutables,
            DstImmutablesComplement.new({
                amount: immutables.amount,
                maker: immutables.maker,
                safetyDeposit: immutables.safetyDeposit,
                token: immutables.token,
                taker: immutables.taker,
                chainId: 1n
            }),
            0n,
            Address.fromBigInt(immutables.taker.toBigint()),
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            Address.fromString('0xb2d83f71914537c3844f25054a96e570be72310b')
        )

        expect(dstAddress).toEqual(
            Address.fromString('0x6f8d14ee0f4a84e4ecc49ef688cd0d7a76ca170c')
        )
    })
})
