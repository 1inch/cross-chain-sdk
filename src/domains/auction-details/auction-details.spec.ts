import {AuctionDetails} from './auction-details.js'
import {hashForSolana} from './hasher.js'

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
        const details = new AuctionDetails({
            duration: 120n,
            initialRateBump: 1000,
            points: [
                {
                    coefficient: 1000,
                    delay: 0
                }
            ],
            startTime: 123n
        })

        const hash = hashForSolana(details)

        expect(hash.toString('hex')).toEqual(
            '98921196703278206a031a3643ae2b841544841960a2861c88bccd2efb18816e'
        )
    })
})
