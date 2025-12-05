import {Whitelist, Address, Extension} from '@1inch/fusion-sdk'
import {EscrowExtension} from './escrow-extension.js'
import {AddressComplement} from '../../domains/addresses/address-complement.js'
import {AuctionDetails} from '../../domains/auction-details/index.js'
import {EvmAddress} from '../../domains/addresses/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {getRandomBytes32} from '../../test-utils/get-random-bytes-32.js'
import {NetworkEnum} from '../../chains.js'

describe('EscrowExtension', () => {
    const factoryAddress = EvmAddress.fromString(
        '0xfb2809a5314473e1165f6b58018e20ed8f07b840'
    )

    const whitelist = Whitelist.new(1717155959n, [
        {
            address: new Address('0xdb05a6a504f04d92e79d0000000000000000dead'),
            allowFrom: 0n
        }
    ])

    const auctionDetails = new AuctionDetails({
        startTime: 1717155959n,
        duration: 180n,
        initialRateBump: 50000,
        points: [{coefficient: 20000, delay: 12}]
    })

    const timeLocks = TimeLocks.new({
        srcWithdrawal: 100n,
        srcPublicWithdrawal: 200n,
        srcCancellation: 300n,
        srcPublicCancellation: 400n,
        dstWithdrawal: 100n,
        dstPublicWithdrawal: 200n,
        dstCancellation: 300n
    })

    // Real extension data from smart contract test (EscrowFactory.t.sol)
    const CONTRACT_EXTENSION =
        '0x00000193000000a0000000a0000000a0000000a0000000500000000000000000' +
        'a0cb889707d426a7a386870a03bc70d1b0697598' +
        '00000000000000000000010007080dbba0050c350000640aae6000640927c0006407a1200064061a80006413' +
        '88149c40320108822d1aa3a7c73eeff8' +
        'a0cb889707d426a7a386870a03bc70d1b0697598' +
        '00000000000000000000010007080dbba0050c350000640aae6000640927c0006407a1200064061a80006413' +
        '88149c40320108822d1aa3a7c73eeff8' +
        'a0cb889707d426a7a386870a03bc70d1b0697598' +
        '834704408a83c220ac4a85bf5c7c42307c4be4a5' +
        '5375ea61702dc3f421dd3c0c63c6b32101102e22' +
        '1388149c4032000000010108822d1aa3a7c73eeff80000' +
        '618f13afea3bd8e19984f2bf7090c650c974de910b63bd6fbf2506cbcdc19dbe' +
        '0000000000000000000000000000000000000000000000000000000000007a69' +
        '0000000000000000000000005615deb798bb3e4dfa0139dfa1b3d433cc23b72f' +
        '000000000000000000199999999999990000000000000000000000000000084b' +
        '00000001000003840000021c0000012c000005fa000003fc000001f400000078'

    it('should roundtrip build and decode', () => {
        const hashLock = HashLock.forSingleFill(getRandomBytes32())

        const ext = new EscrowExtension(
            factoryAddress,
            auctionDetails,
            whitelist,
            hashLock,
            NetworkEnum.ARBITRUM,
            EvmAddress.fromBigInt(1n),
            100n,
            200n,
            timeLocks
        )

        const decoded = EscrowExtension.decode(ext.build().encode())

        expect(decoded.hashLockInfo.toString()).toEqual(hashLock.toString())
        expect(decoded.dstChainId).toEqual(NetworkEnum.ARBITRUM)
        expect(decoded.srcSafetyDeposit).toEqual(100n)
        expect(decoded.dstSafetyDeposit).toEqual(200n)
        expect(decoded.timeLocks.build()).toEqual(timeLocks.build())
    })

    it('should preserve address complement', () => {
        const complement = new AddressComplement(4109710978290235332692594465n)

        const ext = new EscrowExtension(
            factoryAddress,
            auctionDetails,
            whitelist,
            HashLock.forSingleFill(getRandomBytes32()),
            NetworkEnum.ARBITRUM,
            EvmAddress.fromBigInt(1n),
            100n,
            200n,
            timeLocks,
            complement
        )

        const decoded = EscrowExtension.decode(ext.build().encode())

        expect(decoded.dstAddressFirstPart.inner).toEqual(complement.inner)
    })

    it('should handle multiple fills hashlock', () => {
        const hashLock = HashLock.forMultipleFills(
            HashLock.getMerkleLeaves([
                getRandomBytes32(),
                getRandomBytes32(),
                getRandomBytes32()
            ])
        )

        const ext = new EscrowExtension(
            factoryAddress,
            auctionDetails,
            whitelist,
            hashLock,
            NetworkEnum.ARBITRUM,
            EvmAddress.fromBigInt(1n),
            100n,
            200n,
            timeLocks
        )

        const decoded = EscrowExtension.decode(ext.build().encode())

        expect(decoded.hashLockInfo.toString()).toEqual(hashLock.toString())
    })

    it('should decode real extension from smart contract', () => {
        const decoded = EscrowExtension.fromExtension(
            Extension.decode(CONTRACT_EXTENSION)
        )

        expect(decoded.address.toString().toLowerCase()).toBe(
            '0xa0cb889707d426a7a386870a03bc70d1b0697598'
        )

        expect(decoded.hashLockInfo.toString()).toBe(
            '0x618f13afea3bd8e19984f2bf7090c650c974de910b63bd6fbf2506cbcdc19dbe'
        )

        expect(decoded.dstChainId).toBe(31337)

        expect(decoded.dstToken.toHex().toLowerCase()).toContain(
            '5615deb798bb3e4dfa0139dfa1b3d433cc23b72f'
        )

        expect(decoded.srcSafetyDeposit).toBe(7205759403792793n)
        expect(decoded.dstSafetyDeposit).toBe(2123n)

        expect(decoded.timeLocks.build()).toBe(
            BigInt(
                '0x00000001000003840000021c0000012c000005fa000003fc000001f400000078'
            )
        )
    })

    it('should encode extension exactly matching smart contract format', () => {
        const decoded = EscrowExtension.fromExtension(
            Extension.decode(CONTRACT_EXTENSION)
        )

        const reEncoded = decoded.build().encode()

        expect(reEncoded.toLowerCase()).toBe(CONTRACT_EXTENSION.toLowerCase())
    })

    it('should decode fees from extension', () => {
        const decoded = EscrowExtension.fromExtension(
            Extension.decode(CONTRACT_EXTENSION)
        )

        const fees = decoded.extra?.fees

        expect(fees).toBeDefined()
        expect(fees?.integrator.integrator.toString().toLowerCase()).toBe(
            '0x834704408a83c220ac4a85bf5c7c42307c4be4a5'
        )
        expect(fees?.resolver.receiver.toString().toLowerCase()).toBe(
            '0x5375ea61702dc3f421dd3c0c63c6b32101102e22'
        )
    })
})
