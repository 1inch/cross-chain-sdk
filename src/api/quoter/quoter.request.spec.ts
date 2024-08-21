import {Address, NetworkEnum} from '@1inch/fusion-sdk'
import {QuoterRequest} from './quoter.request'

describe(__filename, () => {
    it('should return error if native currency', () => {
        expect(() =>
            QuoterRequest.new({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: Address.NATIVE_CURRENCY.toString(),
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: '1000000000000000000000',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                fee: 1
            })
        ).toThrow(/wrap native currency/)
    })

    it('returns error dstTokenAddress equals ZERO_ADDRESS', () => {
        expect(() =>
            QuoterRequest.new({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                dstTokenAddress: Address.ZERO_ADDRESS.toString(),
                amount: '1000000000000000000000',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                fee: 1
            })
        ).toThrow(/replace/)
    })

    it('returns error if walletAddress invalid', () => {
        expect(() =>
            QuoterRequest.new({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: '1000000000000000000000',
                walletAddress: '0x0000000019ab540356cbb839be05303d7705fa1',
                fee: 1
            })
        ).toThrow(/Invalid address/)
    })

    it('returns error if amount is invalid', () => {
        expect(() =>
            QuoterRequest.new({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: 'dasdad',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                fee: 1
            })
        ).toThrow(/is invalid amount/)
    })

    it('returns error if fee is provided and source not', () => {
        expect(() =>
            QuoterRequest.new({
                srcChain: NetworkEnum.ETHEREUM,
                dstChain: NetworkEnum.ARBITRUM,
                srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
                dstTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                amount: '1000000',
                walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
                fee: 1
            })
        ).toThrow(/cannot use fee without source/)
    })
})
