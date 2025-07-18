import {Interface, parseEther, parseUnits} from 'ethers'
import {Clock} from 'litesvm'
import {web3} from '@coral-xyz/anchor'
import Resolver from '../../dist/contracts/Resolver.sol/Resolver.json'
import {ReadyEvmFork, setupEvm} from '../utils/setup-evm'
import {NetworkEnum} from '../../src/chains'
import {getSecret} from '../utils/secret'
import {ReadySolanaNode, setupSolana} from '../utils/setup-solana'
import {SvmCrossChainOrder} from '../../src/cross-chain-order/svm/svm-cross-chain-order'
import {AuctionDetails} from '../../src/domains/auction-details'
import {HashLock} from '../../src/domains/hash-lock'
import {TimeLocks} from '../../src/domains/time-locks'
import {EvmAddress, SolanaAddress} from '../../src/domains/addresses'
import {USDC_EVM} from '../utils/addresses'
import {SvmSrcEscrowFactory} from '../../src/contracts/svm/svm-src-escrow-factory'

jest.setTimeout(1000 * 10 * 60)

describe('EVM to EVM', () => {
    let srcChain: ReadySolanaNode
    let dstChain: ReadyEvmFork
    const resolverContractEvm = new Interface(Resolver.abi)

    async function advanceNodeTime(duration = 10): Promise<void> {
        const [clock, dstBlock] = await Promise.all([
            srcChain.svm.getClock(),
            dstChain.provider.getBlock('latest', false)
        ])

        const newClock = new Clock(
            clock.slot,
            clock.epochStartTimestamp,
            clock.epoch,
            clock.leaderScheduleEpoch,
            clock.unixTimestamp + BigInt(duration)
        )

        await Promise.all([
            srcChain.svm.setClock(newClock),
            dstChain.provider.send('evm_setNextBlockTimestamp', [
                dstBlock!.timestamp + duration
            ])
        ])
    }

    beforeAll(async () => {
        srcChain = await setupSolana()
        dstChain = await setupEvm({chainId: NetworkEnum.ETHEREUM})
    })

    afterAll(async () => {
        // solana node is in memory, so no cleanup required
        dstChain.provider.destroy()
        await dstChain.localNode.stop()
    })

    it('should perform cross chain swap with single fill', async () => {
        const secret = getSecret()

        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromPublicKey(
                    srcChain.accounts.maker.publicKey
                ),
                receiver: EvmAddress.fromString(
                    await dstChain.maker.getAddress()
                ),
                srcToken: SolanaAddress.fromPublicKey(
                    srcChain.accounts.srcToken.publicKey
                ),
                dstToken: EvmAddress.fromString(USDC_EVM), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: srcChain.chainId,
                dstChainId: dstChain.chainId,
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
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                auction: AuctionDetails.noAuction()
            },
            {
                allowMultipleFills: false
            }
        )

        const srcEscrowFactory = SvmSrcEscrowFactory.DEFAULT

        // user submits order creation onchain
        const createSrcIx = srcEscrowFactory.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })
        const initTx = new web3.Transaction().add({
            ...createSrcIx,
            programId: new web3.PublicKey(createSrcIx.programId.toBuffer()),
            keys: createSrcIx.accounts.map((a) => ({
                ...a,
                pubkey: new web3.PublicKey(a.pubkey.toBuffer())
            }))
        })

        await srcChain.connection.sendTransaction(initTx, [
            srcChain.accounts.maker
        ])
    })
})
