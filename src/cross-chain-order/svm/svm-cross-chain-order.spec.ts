import {parseEther, parseUnits} from 'ethers'
import {SvmCrossChainOrder} from './svm-cross-chain-order'
import {NetworkEnum} from '../../chains'
import {TimeLocks} from '../../domains/time-locks'
import {HashLock} from '../../domains/hash-lock'
import {AuctionDetails} from '../../domains/auction-details'
import {EvmAddress, SolanaAddress} from '../../domains/addresses'

describe('SVMCrossChainOrder', () => {
    it('should correct calculate order hash', () => {
        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(
                    '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
                )
            },
            {
                auction: AuctionDetails.noAuction(120n, 1752739636n)
            },
            {
                allowMultipleFills: false,
                salt: 0x63030535n
            }
        )

        const hash = order.getOrderHashBuffer()

        expect(hash.toString('hex')).toEqual(
            'f59558e3ddb28b3aaa4953e12efc4c7b0d98c637942be3b5e8615998a5bf65c4'
        )
    })

    it('should correct toJSON/fromJSON', () => {
        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(
                    '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
                )
            },
            {
                auction: AuctionDetails.noAuction(120n, 1752739636n)
            },
            {
                allowMultipleFills: false,
                salt: 0x63030535n
            }
        )

        const json = order.toJSON()

        expect(json).toMatchSnapshot()
        expect(SvmCrossChainOrder.fromJSON(json)).toEqual(order)
    })
})
