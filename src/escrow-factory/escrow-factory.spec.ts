import {Address, NetworkEnum} from '@1inch/fusion-sdk'
import {keccak256} from 'ethers'
import {EscrowFactoryFacade} from './escrow-factory-facade'
import {EscrowFactoryZksync} from './escrow-factory-zksync'
import {DstImmutablesComplement, Immutables} from '../immutables'
import {HashLock, TimeLocks} from '../cross-chain-order'

describe('EscrowAddressFacade', () => {
    it('Should correct calc src/dst address for Ethereum', () => {
        const facade = new EscrowFactoryFacade(
            NetworkEnum.ETHEREUM,
            Address.fromBigInt(1n)
        )
        const immutablesHash = keccak256('0x')
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = facade.getEscrowAddress(
            immutablesHash,
            srcImplAddress
        )
        const dstAddress = facade.getEscrowAddress(
            immutablesHash,
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            new Address('0x2f8f065e797ad5499066c0e7d1f8f1c0405e3179')
        )

        expect(dstAddress).toEqual(
            new Address('0x291200ceb5fab3847c9f30c5f272961f78d6cfd4')
        )
    })

    it('Should correct calc src/dst address for Ethereum 2', () => {
        const facade = new EscrowFactoryFacade(
            NetworkEnum.ETHEREUM,
            Address.fromBigInt(1n)
        )

        const immutables = Immutables.new({
            maker: new Address('0x04d3b2c70208f3fb196affef78080b3cc05ee1cb'),
            taker: new Address('0x9c4dffb4f7e8217a8ac0555d67e125f8769284ba'),
            token: new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
            amount: 99345341n,
            hashLock: HashLock.fromString(
                '0x939dbeb956ac9369de8b1acaaa78a173620c2275fba501f8340b91cbceabdbf1'
            ),
            orderHash:
                '0x8ed7de0668228e00103038a7fc6a19c933d56fca27b154a3e532ebeb4a5c07bd',
            timeLocks:
                TimeLocks.fromBigInt(
                    46545443980783778519496226194286874737220106048808714334632784681655911579684n
                ),
            safetyDeposit: 2474844692460000n
        })
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = facade.getSrcEscrowAddress(
            immutables,
            srcImplAddress
        )
        const dstAddress = facade.getDstEscrowAddress(
            immutables,
            DstImmutablesComplement.new({
                amount: immutables.amount,
                maker: immutables.maker,
                safetyDeposit: immutables.safetyDeposit,
                token: immutables.token
            }),
            0n,
            immutables.taker,
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            new Address('0xf97a2ae8f0481c1cc11bf8cb962b088bc5f6a945')
        )

        expect(dstAddress).toEqual(
            new Address('0x5177d276a4b46b0cbb5ae98d296663fcee0138c4')
        )
    })

    describe('zkSync', () => {
        it('Should calc correct src address from immutables', () => {
            const immutables = Immutables.new({
                maker: new Address(
                    '0x04d3b2c70208f3fb196affef78080b3cc05ee1cb'
                ),
                taker: new Address(
                    '0x9c4dffb4f7e8217a8ac0555d67e125f8769284ba'
                ),
                token: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                amount: 99345341n,
                hashLock: HashLock.fromString(
                    '0x939dbeb956ac9369de8b1acaaa78a173620c2275fba501f8340b91cbceabdbf1'
                ),
                orderHash:
                    '0x8ed7de0668228e00103038a7fc6a19c933d56fca27b154a3e532ebeb4a5c07bd',
                timeLocks:
                    TimeLocks.fromBigInt(
                        46545443980783778519496226194286874737220106048808714334632784681655911579684n
                    ),
                safetyDeposit: 2474844692460000n
            })

            const factory = new EscrowFactoryZksync(
                new Address('0x584aEaB186D81dbB52a8a14820c573480c3d4773')
            )

            expect(
                factory.getSrcEscrowAddress(
                    immutables,
                    new Address('0xddc60c7babfc55d8030f51910b157e179f7a41fc')
                )
            ).toEqual(new Address('0x98f0a945348c031f85164562bff61eb08a0629df'))
        })
        it('Should calc correct dst address from immutables', () => {
            const immutables = Immutables.new({
                maker: new Address(
                    '0x04d3b2c70208f3fb196affef78080b3cc05ee1cb'
                ),
                taker: new Address(
                    '0x9c4dffb4f7e8217a8ac0555d67e125f8769284ba'
                ),
                token: new Address(
                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                ),
                amount: 99345341n,
                hashLock: HashLock.fromString(
                    '0x939dbeb956ac9369de8b1acaaa78a173620c2275fba501f8340b91cbceabdbf1'
                ),
                orderHash:
                    '0x8ed7de0668228e00103038a7fc6a19c933d56fca27b154a3e532ebeb4a5c07bd',
                timeLocks:
                    TimeLocks.fromBigInt(
                        46545443980783778519496226194286874737220106048808714334632784681655911579684n
                    ),
                safetyDeposit: 2474844692460000n
            })

            const factory = new EscrowFactoryZksync(
                new Address('0x584aEaB186D81dbB52a8a14820c573480c3d4773')
            )

            expect(
                factory.getEscrowAddress(
                    immutables.hash(),
                    new Address('0xdc4ccc2fc2475d0ed3fddd563c44f2bf6a3900c9')
                )
            ).toEqual(new Address('0x93d8a039c23cffd1067e02edbdd28189ac679a39'))
        })
    })
})
