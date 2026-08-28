import {AuctionDetails} from './domains/auction-details/index.js'
import {EvmAddress} from './domains/addresses/index.js'
import {HashLock} from './domains/hash-lock/index.js'
import {TimeLocks} from './domains/time-locks/index.js'
import {EvmCrossChainOrder} from './cross-chain-order/evm/evm-cross-chain-order.js'
import {
    ESCROW_DST_IMPLEMENTATION,
    ESCROW_FACTORY,
    ESCROW_SRC_IMPLEMENTATION,
    TRUE_ERC20
} from './deployments.js'
import {EvmChain, isEvm, NetworkEnum, SupportedChains} from './chains.js'
import {getRandomBytes32} from './test-utils/get-random-bytes-32.js'
import {now} from './utils/index.js'

const EVM_CHAINS = SupportedChains.filter(isEvm)

const ADDRESS_RE = /^0x[0-9a-f]{40}$/
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const createOrder = (
    srcChainId: EvmChain,
    dstChainId: EvmChain
): EvmCrossChainOrder =>
    EvmCrossChainOrder.new(
        ESCROW_FACTORY[srcChainId],
        {
            maker: EvmAddress.fromString(
                '0x00000000219ab540356cbb839cbe05303d7705fa'
            ),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: EvmAddress.fromString(
                '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
            ),
            makingAmount: 100_000000n,
            takingAmount: 90_000000n
        },
        {
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId,
            dstChainId,
            srcSafetyDeposit: 1000n,
            dstSafetyDeposit: 1000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 1n,
                srcPublicWithdrawal: 2n,
                srcCancellation: 3n,
                srcPublicCancellation: 4n,
                dstWithdrawal: 1n,
                dstPublicWithdrawal: 2n,
                dstCancellation: 3n
            })
        },
        {
            auction: new AuctionDetails({
                startTime: BigInt(now()),
                duration: 180n,
                points: [],
                initialRateBump: 100_000
            }),
            whitelist: [
                {
                    address: EvmAddress.fromString(
                        '0x00000000219ab540356cbb839cbe05303d7705fa'
                    ),
                    allowFrom: 0n
                }
            ]
        },
        {
            nonce: 1n
        }
    )

describe('deployments', () => {
    it.each(EVM_CHAINS)(
        'should have all escrow deployments and TrueERC20 for chain %d',
        (chainId) => {
            for (const map of [
                TRUE_ERC20,
                ESCROW_FACTORY,
                ESCROW_SRC_IMPLEMENTATION,
                ESCROW_DST_IMPLEMENTATION
            ]) {
                const address = map[chainId]
                expect(address).toBeDefined()
                expect(address.toString()).toMatch(ADDRESS_RE)
                expect(address.toString()).not.toEqual(ZERO_ADDRESS)
            }
        }
    )
})

describe('EvmCrossChainOrder on all supported EVM chains', () => {
    it.each(EVM_CHAINS)(
        'should build order with chain %d as source',
        (srcChainId) => {
            const dstChainId =
                srcChainId === NetworkEnum.ETHEREUM
                    ? NetworkEnum.POLYGON
                    : NetworkEnum.ETHEREUM

            const order = createOrder(srcChainId, dstChainId)
            const typedData = order.getTypedData(srcChainId)

            expect(Number(typedData.domain.chainId)).toEqual(srcChainId)
            expect(typedData.domain.verifyingContract).toMatch(ADDRESS_RE)
            expect(typedData.domain.verifyingContract).not.toEqual(ZERO_ADDRESS)
            expect(order.getOrderHash(srcChainId)).toMatch(/^0x[0-9a-f]{64}$/)
            expect(Number(order.escrowExtension.dstChainId)).toEqual(dstChainId)
        }
    )

    it.each(EVM_CHAINS)(
        'should build order with chain %d as destination',
        (dstChainId) => {
            const srcChainId =
                dstChainId === NetworkEnum.ETHEREUM
                    ? NetworkEnum.POLYGON
                    : NetworkEnum.ETHEREUM

            const order = createOrder(srcChainId, dstChainId)

            expect(Number(order.escrowExtension.dstChainId)).toEqual(dstChainId)
            expect(
                Number(order.getTypedData(srcChainId).domain.chainId)
            ).toEqual(srcChainId)
        }
    )
})
