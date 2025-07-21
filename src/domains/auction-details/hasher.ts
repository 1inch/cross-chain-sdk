import {BorshCoder} from '@coral-xyz/anchor'
import {keccak256} from 'ethers'
import {AuctionDetails} from './auction-details'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {bufferFromHex} from '../../utils/bytes'
import {IDL} from '../../idl/cross-chain-escrow-src'

export function hashForSolana(details: AuctionDetails): Buffer {
    const bytes = new BorshCoder(IDL).types.encode('auctionData', {
        startTime: Number(details.startTime),
        duration: Number(details.duration),
        initialRateBump: Number(details.initialRateBump),
        pointsAndTimeDeltas: details.points.map((p) => ({
            rateBump: uintAsBeBytes(BigInt(p.coefficient), 24),
            timeDelta: p.delay
        }))
    })

    return bufferFromHex(keccak256(bytes))
}
