import {Whitelist, Address} from '@1inch/fusion-sdk'
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
        {address: new Address('0xdb05a6a504f04d92e79d0000000000000000dead'), allowFrom: 0n}
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
})
