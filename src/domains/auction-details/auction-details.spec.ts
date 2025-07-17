import {AuctionDetails} from './auction-details'
import {hashForSolana} from './hasher'

describe('Auction details', () => {
    it('Should encode/decode details', () => {
        const details = new AuctionDetails({
            duration: 180n,
            startTime: 1673548149n,
            initialRateBump: 50000,
            points: [
                {
                    delay: 10,
                    coefficient: 10000
                },
                {
                    delay: 20,
                    coefficient: 5000
                }
            ]
        })

        expect(AuctionDetails.decode(details.encode())).toStrictEqual(details)
    })

    it('should calculate hash of struct for solana', () => {
        const details = AuctionDetails.noAuction(120n, 1752739636n)

        const hash = hashForSolana(details)

        expect(hash.toString('hex')).toEqual(
            '1ce1d373c68016031fcea0d17fd0fc7d4348109e1d8c6be83f0b4fb099b8887a'
        )
    })
})
