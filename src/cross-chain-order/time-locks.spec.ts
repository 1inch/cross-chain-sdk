import {randBigInt} from '@1inch/fusion-sdk'
import {UINT_256_MAX, UINT_32_MAX} from '@1inch/byte-utils'
import {TimeLocks} from './time-locks'

describe('TimeLocks', () => {
    it('Should encode/decode', () => {
        const timeLock = TimeLocks.fromBigInt(randBigInt(UINT_256_MAX))

        expect(TimeLocks.fromBigInt(timeLock.build())).toEqual(timeLock)
    })

    it('Should encode/decode max value', () => {
        const timeLock = TimeLocks.fromBigInt(UINT_256_MAX)

        expect(TimeLocks.fromBigInt(timeLock.build())).toEqual(timeLock)
        expect(timeLock.deployedAt).toEqual(UINT_32_MAX)
        expect(timeLock.srcWithdrawal).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.srcPublicWithdrawal).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.srcCancellation).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.srcPublicCancellation).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.dstWithdrawal).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.dstPublicWithdrawal).toEqual(UINT_32_MAX * 2n)
        expect(timeLock.dstCancellation).toEqual(UINT_32_MAX * 2n)
    })
})
