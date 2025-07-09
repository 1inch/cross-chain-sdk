import {UINT_32_MAX} from '@1inch/byte-utils'
import {now} from '@1inch/fusion-sdk'
import {TimeLocks} from './time-locks'
import {SrcStage} from './src-time-locks'
import {DstStage} from './dst-time-locks'

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

    it('Should transform to SrcTimeLocks', () => {
        const timeLock = TimeLocks.new({
            srcWithdrawal: 1n,
            srcPublicWithdrawal: 2n,
            srcCancellation: 3n,
            srcPublicCancellation: 4n,
            dstWithdrawal: 1n,
            dstPublicWithdrawal: 2n,
            dstCancellation: 3n
        })

        expect(() => timeLock.toSrcTimeLocks()).toThrow() // no deployment time
        const deployedAt = now()
        const srcTimeLock = timeLock.toSrcTimeLocks(deployedAt)

        expect(srcTimeLock.deployedAt).toEqual(deployedAt)
        expect(srcTimeLock.privateWithdrawal).toEqual(deployedAt + 1n)
        expect(srcTimeLock.publicWithdrawal).toEqual(deployedAt + 2n)
        expect(srcTimeLock.privateCancellation).toEqual(deployedAt + 3n)
        expect(srcTimeLock.publicCancellation).toEqual(deployedAt + 4n)

        expect(srcTimeLock.isFinalityLock(deployedAt)).toEqual(true)
        expect(srcTimeLock.isPrivateWithdrawal(deployedAt + 1n)).toEqual(true)
        expect(srcTimeLock.isPublicWithdrawal(deployedAt + 2n)).toEqual(true)
        expect(srcTimeLock.isPrivateCancellation(deployedAt + 3n)).toEqual(true)
        expect(srcTimeLock.isPublicCancellation(deployedAt + 4n)).toEqual(true)

        expect(srcTimeLock.getStage(deployedAt)).toEqual(SrcStage.FinalityLock)
        expect(srcTimeLock.getStage(deployedAt + 1n)).toEqual(
            SrcStage.PrivateWithdrawal
        )
        expect(srcTimeLock.getStage(deployedAt + 2n)).toEqual(
            SrcStage.PublicWithdrawal
        )
        expect(srcTimeLock.getStage(deployedAt + 3n)).toEqual(
            SrcStage.PrivateCancellation
        )
        expect(srcTimeLock.getStage(deployedAt + 4n)).toEqual(
            SrcStage.PublicCancellation
        )
    })

    it('Should transform to DstTimeLocks', () => {
        const timeLock = TimeLocks.new({
            srcWithdrawal: 1n,
            srcPublicWithdrawal: 2n,
            srcCancellation: 3n,
            srcPublicCancellation: 4n,
            dstWithdrawal: 1n,
            dstPublicWithdrawal: 2n,
            dstCancellation: 3n
        })

        expect(() => timeLock.toDstTimeLocks()).toThrow() // no deployment time
        const deployedAt = now()
        const srcTimeLock = timeLock.toDstTimeLocks(deployedAt)

        expect(srcTimeLock.deployedAt).toEqual(deployedAt)
        expect(srcTimeLock.privateWithdrawal).toEqual(deployedAt + 1n)
        expect(srcTimeLock.publicWithdrawal).toEqual(deployedAt + 2n)
        expect(srcTimeLock.privateCancellation).toEqual(deployedAt + 3n)

        expect(srcTimeLock.isFinalityLock(deployedAt)).toEqual(true)
        expect(srcTimeLock.isPrivateWithdrawal(deployedAt + 1n)).toEqual(true)
        expect(srcTimeLock.isPublicWithdrawal(deployedAt + 2n)).toEqual(true)
        expect(srcTimeLock.isPrivateCancellation(deployedAt + 3n)).toEqual(true)

        expect(srcTimeLock.getStage(deployedAt)).toEqual(DstStage.FinalityLock)
        expect(srcTimeLock.getStage(deployedAt + 1n)).toEqual(
            DstStage.PrivateWithdrawal
        )
        expect(srcTimeLock.getStage(deployedAt + 2n)).toEqual(
            DstStage.PublicWithdrawal
        )
        expect(srcTimeLock.getStage(deployedAt + 3n)).toEqual(
            DstStage.PrivateCancellation
        )
    })

    it('Should set deployedAt', () => {
        const timeLock = TimeLocks.new({
            srcWithdrawal: 0n, // no finality lock for test
            srcPublicWithdrawal: 120n, // 2m for private withdrawal
            srcCancellation: 121n, // 1sec public withdrawal
            srcPublicCancellation: 122n, // 1sec private cancellation
            dstWithdrawal: 0n, // no finality lock for test
            dstPublicWithdrawal: 120n, // 2m private withdrawal
            dstCancellation: 121n // 1sec public withdrawal
        })

        timeLock.setDeployedAt(0x66b5e815n)

        expect(timeLock.build().toString(16)).toEqual(
            '66b5e8150000007900000078000000000000007a000000790000007800000000'
        )
    })

    it('should create from durations', () => {
        const fromOffsets = TimeLocks.new({
            srcWithdrawal: 1n,
            srcPublicWithdrawal: 2n,
            srcCancellation: 3n,
            srcPublicCancellation: 4n,
            dstWithdrawal: 1n,
            dstPublicWithdrawal: 2n,
            dstCancellation: 3n
        })
        const fromDurations = TimeLocks.fromDurations({
            dstFinalityLock: 1n,
            dstPrivateWithdrawal: 1n,
            dstPublicWithdrawal: 1n,
            srcFinalityLock: 1n,
            srcPrivateCancellation: 1n,
            srcPrivateWithdrawal: 1n,
            srcPublicWithdrawal: 1n
        })

        expect(fromOffsets).toStrictEqual(fromDurations)
    })
})
