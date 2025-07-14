import {Instruction} from './instruction'
import {SvmCrossChainOrder} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {SolanaAddress} from '../../domains/addresses'

export class SvmEscrowFactory {
    static DEFAULT = new SvmEscrowFactory(
        new SolanaAddress('6NwMYeUmigiMDjhYeYpbxC6Kc63NzZy1dfGd7fGcdkVS')
    )

    constructor(public readonly programId: SolanaAddress) {}

    public createOrder(order: SvmCrossChainOrder): Instruction {
      
    }
}
