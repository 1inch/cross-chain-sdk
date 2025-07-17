import {BorshCoder, Idl} from '@coral-xyz/anchor'
import {keccak256} from 'ethers'
import {AuctionDetails} from './auction-details'

const types = {
    types: [
        {
            name: 'auctionData',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'startTime', type: 'u32'},
                    {name: 'duration', type: 'u32'},
                    {name: 'initialRateBump', type: 'u16'},
                    {
                        name: 'pointsAndTimeDeltas',
                        type: {vec: {defined: {name: 'pointAndTimeDelta'}}}
                    }
                ]
            }
        },
        {
            name: 'pointAndTimeDelta',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'rateBump', type: 'u16'},
                    {name: 'timeDelta', type: 'u16'}
                ]
            }
        }
    ],
    instructions: [] as Idl['instructions']
}

export function hashForSolana(details: AuctionDetails): Buffer {
    const bytes = new BorshCoder(types as Idl).types.encode('auctionData', {
        startTime: Number(details.startTime),
        duration: Number(details.duration),
        initialRateBump: Number(details.initialRateBump),
        pointsAndTimeDeltas: details.points.map((p) => ({
            rateBump: p.coefficient,
            timeDelta: p.delay
        }))
    })

    return Buffer.from(keccak256(bytes).slice(2), 'hex')
}
