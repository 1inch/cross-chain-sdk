import {Address} from '@1inch/fusion-sdk'
import {Bps} from '@1inch/limit-order-sdk'
import {QuoterRequest} from './quoter.request.js'
import {EvmAddress} from '../../domains/index.js'
import {NetworkEnum} from '../../chains.js'

const testReceiver = EvmAddress.fromString(
    '0x1234567890123456789012345678901234567890'
)

describe('QuoterRequest', () => {
    it('returns error dstTokenAddress equals ZERO_ADDRESS', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                dstTokenAddress: Address.ZERO_ADDRESS.toString(),
                amount: '1000000000000000000000',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                integratorFee: {receiver: testReceiver, value: new Bps(1n)}
            })
        ).toThrow(/replace/)
    })

    it('returns error if walletAddress invalid', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: '1000000000000000000000',
                walletAddress: '0x0000000019ab540356cbb839be05303d7705fa1',
                integratorFee: {receiver: testReceiver, value: new Bps(1n)}
            })
        ).toThrow(/Invalid address/)
    })

    it('returns error if amount is invalid', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: 'dasdad',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                integratorFee: {receiver: testReceiver, value: new Bps(1n)}
            })
        ).toThrow(/is invalid amount/)
    })

    it('allows integratorFee without source', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: '1000000',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                integratorFee: {receiver: testReceiver, value: new Bps(1n)}
            })
        ).not.toThrow()
    })

    it('builds a Solana request and classifies src chain', () => {
        const request = QuoterRequest.forSolana({
            srcChain: NetworkEnum.SOLANA,
            dstChain: NetworkEnum.ETHEREUM,
            srcTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            dstTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1000000',
            walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
            enableEstimate: true,
            permit: '0xperm',
            isPermit2: true
        })

        expect(request.isSolanaRequest()).toBe(true)
        expect(request.isEvmRequest()).toBe(false)
        expect(QuoterRequest.isSolanaRequest(request.build() as never)).toBe(
            true
        )
        expect(
            QuoterRequest.isEvmRequest({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.POLYGON,
                srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                amount: '1',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
            })
        ).toBe(true)

        const built = request.build()
        expect(built.srcChain).toBe(NetworkEnum.SOLANA)
        expect(built.enableEstimate).toBe(true)
        expect(built.isPermit2).toBe(true)
        expect(built.permit).toBe('0xperm')
    })

    it('rejects a Solana factory used for an EVM src chain', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.SOLANA as never,
                dstChain: NetworkEnum.ETHEREUM,
                srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                dstTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                amount: '1',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
            })
        ).toThrow(/cannot use non evm/)
    })

    it('rejects same src and dst chain', () => {
        expect(() =>
            QuoterRequest.forEVM({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ETHEREUM,
                srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                dstTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                amount: '1',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
            })
        ).toThrow(/should be different/)
    })
})
