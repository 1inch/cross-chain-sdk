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
            '0a80fc3dd50039965708025489e18575ac7ec779229371508726fedd9c1502cc'
        )
    })
})
