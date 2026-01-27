import {Address, NetworkEnum} from '@1inch/fusion-sdk'
import {Bps} from '@1inch/limit-order-sdk'
import {QuoterRequest} from './quoter.request.js'
import {EvmAddress} from '../../domains/index.js'

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
})
