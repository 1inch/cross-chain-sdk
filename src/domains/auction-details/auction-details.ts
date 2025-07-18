import {
    AuctionDetails as BaseAuctionDetails,
    Extension
} from '@1inch/fusion-sdk'
import {AuctionPoint} from './types'
import {now} from '../../utils'

export class AuctionDetails extends BaseAuctionDetails {
    static decode(data: string): AuctionDetails {
        return AuctionDetails.fromBase(BaseAuctionDetails.decode(data))
    }

    static fromBase(base: BaseAuctionDetails): AuctionDetails {
        return new AuctionDetails({
            ...base,
            initialRateBump: Number(base.initialRateBump)
        })
    }

    static fromExtension(extension: Extension): AuctionDetails {
        return AuctionDetails.fromBase(
            BaseAuctionDetails.fromExtension(extension)
        )
    }

    static noAuction(
        duration = 120n,
        startTime = BigInt(now())
    ): AuctionDetails {
        return new AuctionDetails({
            startTime,
            initialRateBump: 0,
            duration,
            points: []
        })
    }

    static fromJSON(data: AuctionDetailsJSON): AuctionDetails {
        return new AuctionDetails({
            startTime: BigInt(data.startTime),
            initialRateBump: data.initialRateBump,
            duration: BigInt(data.duration),
            points: data.points,
            gasCost: {
                gasBumpEstimate: BigInt(data.gasCost.gasBumpEstimate),
                gasPriceEstimate: BigInt(data.gasCost.gasPriceEstimate)
            }
        })
    }

    public toJSON(): AuctionDetailsJSON {
        return {
            duration: this.duration.toString(),
            gasCost: {
                gasBumpEstimate: this.gasCost.gasBumpEstimate.toString(),
                gasPriceEstimate: this.gasCost.gasPriceEstimate.toString()
            },
            points: this.points,
            initialRateBump: Number(this.initialRateBump),
            startTime: this.startTime.toString()
        }
    }
}

export type AuctionDetailsJSON = {
    startTime: string
    duration: string
    initialRateBump: number
    points: AuctionPoint[]
    gasCost: {
        gasBumpEstimate: string
        gasPriceEstimate: string
    }
}
