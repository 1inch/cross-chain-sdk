import {UINT_32_MAX} from '@1inch/byte-utils'
import {TimeLocks} from './time-locks'

describe('TimeLocks', () => {
    it('Should encode/decode', () => {
        const timeLock = TimeLocks.new({
            srcWithdrawal: 1n,
            srcPublicWithdrawal: 2n,
            srcCancellation: 3n,
            srcPublicCancellation: 4n,
            dstWithdrawal: 1n,
            dstPublicWithdrawal: 2n,
            dstCancellation: 3n
        })

        expect(TimeLocks.fromBigInt(timeLock.build())).toEqual(timeLock)
    })

    it('Should encode/decode max value', () => {
        const timeLock = TimeLocks.new({
            srcWithdrawal: UINT_32_MAX - 3n,
            srcPublicWithdrawal: UINT_32_MAX - 2n,
            srcCancellation: UINT_32_MAX - 1n,
            srcPublicCancellation: UINT_32_MAX,
            dstWithdrawal: UINT_32_MAX - 2n,
            dstPublicWithdrawal: UINT_32_MAX - 1n,
            dstCancellation: UINT_32_MAX
        })
        expect(TimeLocks.fromBigInt(timeLock.build())).toEqual(timeLock)
    })
})
