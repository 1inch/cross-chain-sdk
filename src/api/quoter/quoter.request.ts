import {isValidAmount} from '@1inch/fusion-sdk'
import assert from 'assert'
import {QuoterRequestParams} from './types.js'
import {
    EvmChain,
    isEvm,
    isSolana,
    SolanaChain,
    SupportedChain
} from '../../chains.js'
import {createAddress, EvmAddress, SolanaAddress} from '../../domains/index.js'
import type {AddressForChain} from '../../type-utils.js'

export class QuoterRequest<
    SrcChain extends SupportedChain = SupportedChain,
    DstChain extends SupportedChain = SupportedChain
> {
    // eslint-disable-next-line max-params
    private constructor(
        public readonly srcChain: SrcChain,
        public readonly dstChain: DstChain,
        public readonly srcTokenAddress: AddressForChain<SrcChain>,
        public readonly dstTokenAddress: AddressForChain<DstChain>,
        public readonly amount: bigint,
        public readonly walletAddress: AddressForChain<SrcChain>,
        public readonly enableEstimate: boolean = false,
        public readonly permit: string | undefined,
        public readonly fee: number | undefined,
        public readonly source: string | undefined,
        public readonly isPermit2: boolean = false
    ) {
        if ((srcChain as SupportedChain) === (dstChain as SupportedChain)) {
            throw new Error('srcChain and dstChain should be different')
        }
    }

    static isEvmRequest(
        params: QuoterRequestParams
    ): params is QuoterRequestParams<EvmChain> {
        return isEvm(params.srcChain)
    }

    static isSolanaRequest(
        params: QuoterRequestParams
    ): params is QuoterRequestParams<SolanaChain> {
        return isSolana(params.srcChain)
    }

    static forEVM(
        params: QuoterRequestParams<EvmChain>
    ): QuoterRequest<EvmChain> {
        assert(
            isEvm(params.srcChain),
            'cannot use non evm quote request for srcChain'
        )

        assert(
            isValidAmount(params.amount),
            `${params.amount} is invalid amount`
        )

        const srcToken = EvmAddress.fromString(params.srcTokenAddress)
        const dstToken = createAddress(params.dstTokenAddress, params.dstChain)

        if (isEvm(params.dstChain)) {
            assert(
                !dstToken.isZero(),
                `replace ${EvmAddress.ZERO} with ${EvmAddress.NATIVE}`
            )
        }

        return new QuoterRequest<EvmChain>(
            params.srcChain,
            params.dstChain,
            srcToken,
            dstToken,
            BigInt(params.amount),
            EvmAddress.fromString(params.walletAddress),
            params.enableEstimate,
            params.permit,
            params.fee,
            params.source,
            params.isPermit2
        )
    }

    static forSolana(
        params: QuoterRequestParams<SolanaChain>
    ): QuoterRequest<SolanaChain> {
        assert(
            isSolana(params.srcChain),
            'cannot use non solana quote request for srcChain'
        )

        assert(
            isValidAmount(params.amount),
            `${params.amount} is invalid amount`
        )

        const srcToken = SolanaAddress.fromString(params.srcTokenAddress)
        const dstToken = createAddress(params.dstTokenAddress, params.dstChain)

        return new QuoterRequest<SolanaChain>(
            params.srcChain,
            params.dstChain,
            srcToken,
            dstToken,
            BigInt(params.amount),
            SolanaAddress.fromString(params.walletAddress),
            params.enableEstimate,
            params.permit,
            params.fee,
            params.source,
            params.isPermit2
        )
    }

    isEvmRequest(): this is QuoterRequest<EvmChain> {
        return isEvm(this.srcChain)
    }

    isSolanaRequest(): this is QuoterRequest<SolanaChain> {
        return isSolana(this.srcChain)
    }

    build(): QuoterRequestParams {
        return {
            srcChain: this.srcChain,
            dstChain: this.dstChain,
            srcTokenAddress: this.srcTokenAddress.toString(),
            dstTokenAddress: this.dstTokenAddress.toString(),
            amount: this.amount.toString(),
            walletAddress: this.walletAddress.toString(),
            enableEstimate: this.enableEstimate,
            permit: this.permit,
            fee: this.fee,
            source: this.source,
            isPermit2: this.isPermit2
        }
    }
}
