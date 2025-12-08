import {web3} from '@coral-xyz/anchor'
import {TakerTraits, AmountMode} from '@1inch/fusion-sdk'
import {Signature, Interface} from 'ethers'
import assert from 'assert'
import {ReadyEvmFork} from './setup-evm.js'
import {Instruction} from '../../src/contracts/svm/instruction.js'
import {EvmCrossChainOrder} from '../../src/cross-chain-order/index.js'
import {EscrowFactory} from '../../src/contracts/evm/escrow-factory.js'
import {Immutables, EvmAddress, HashLock} from '../../src/domains/index.js'

export function newSolanaTx(ix: Instruction): web3.Transaction {
    return new web3.Transaction().add({
        ...ix,
        programId: new web3.PublicKey(ix.programId.toBuffer()),
        keys: ix.accounts.map((a) => ({
            ...a,
            pubkey: new web3.PublicKey(a.pubkey.toBuffer())
        }))
    })
}

export function getEvmFillData(
    resolverContract: Interface,
    order: EvmCrossChainOrder,
    signature: string,
    immutables: Immutables<EvmAddress>,
    chainConfig: ReadyEvmFork,
    leaves = [],
    secretHashes = [],
    fillAmount = order.makingAmount,
    remainingAmount = fillAmount
): string {
    const takerTraits = TakerTraits.default()
        .setAmountMode(AmountMode.maker)
        .setExtension(order.extension)

    if (order.multipleFillsAllowed) {
        assert(
            leaves.length && secretHashes.length,
            'no leaves or secret hashes provided'
        )
        const idx = order.getMultipleFillIdx(fillAmount, remainingAmount)

        takerTraits.setInteraction(
            new EscrowFactory(
                EvmAddress.fromString(chainConfig.addresses.escrowFactory)
            ).getMultipleFillInteraction(
                HashLock.getProof(leaves!, idx),
                idx,
                secretHashes![idx]
            )
        )
    }

    const {r, yParityAndS: vs} = Signature.from(signature)

    const {args, trait} = takerTraits.encode()

    return resolverContract.encodeFunctionData('deploySrc', [
        immutables.build(),
        order.build(),
        r,
        vs,
        fillAmount,
        trait,
        args
    ])
}
