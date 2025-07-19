import {SolanaAddress} from '../../domains/addresses'

export class SvmDstEscrowFactory {
    static DEFAULT = new SvmDstEscrowFactory(
        new SolanaAddress('GveV3ToLhvRmeq1Fyg3BMkNetZuG9pZEp4uBGWLrTjve')
    )

    constructor(public readonly programId: SolanaAddress) {}
}
