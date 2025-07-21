import {BN, BorshCoder} from '@coral-xyz/anchor'
import {Instruction} from './instruction'
import {BaseProgram} from './base-program'
import {bigintToBN} from '../../utils/numbers/bigint-to-bn'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {uint256split} from '../../utils/numbers/uint256-split'
import {getAta, getPda} from '../../utils'
import {Immutables, SolanaAddress} from '../../domains'
import {IDL} from '../../idl/cross-chain-escrow-dst'

export class SvmDstEscrowFactory extends BaseProgram {
    static DEFAULT = new SvmDstEscrowFactory(
        new SolanaAddress('GveV3ToLhvRmeq1Fyg3BMkNetZuG9pZEp4uBGWLrTjve')
    )

    private readonly coder = new BorshCoder(IDL)

    constructor(programId: SolanaAddress) {
        super(programId)
    }

    public getEscrowAddress(params: EscrowAddressParams): SolanaAddress {
        return getPda(this.programId, [
            this.encoder.encode('escrow'),
            params.orderHash,
            params.hashLock.toBuffer(),
            params.maker.toBuffer(),
            uintAsBeBytes(params.amount, 64)
        ])
    }

    public createEscrow(
        params: Immutables<SolanaAddress>,
        extra: {
            /**
             * TokenProgram or TokenProgram 2022
             */
            tokenProgramId: SolanaAddress
            srcCancellationTimestamp: bigint
        }
    ): Instruction {
        const token = params.token.isNative()
            ? SolanaAddress.WRAPPED_NATIVE
            : params.token

        const data = this.coder.instruction.encode('create', {
            orderHash: params.orderHash,
            hashlock: params.hashLock.toBuffer(),
            amount: new BN(params.amount.toString()),
            safetyDeposit: new BN(params.safetyDeposit.toString()),
            recipient: params.maker,
            timelocks: uint256split(params.timeLocks.build()).map(bigintToBN),
            srcCancellationTimestamp: Number(extra.srcCancellationTimestamp),
            assetIsNative: params.token.isNative()
        })

        const escrowAddress = this.getEscrowAddress(params)

        return new Instruction(
            this.programId,
            [
                {
                    // 1. taker
                    pubkey: params.taker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 2. mint
                    pubkey: token,
                    isWritable: false,
                    isSigner: false
                },
                this.optionalAccount(
                    {
                        // 3. taker_ata
                        pubkey: getAta(
                            params.taker,
                            token,
                            extra.tokenProgramId
                        ),
                        isSigner: false,
                        isWritable: true
                    },
                    params.token.isNative()
                ),
                {
                    // 4. escrow
                    pubkey: escrowAddress,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 5. escrow ata
                    pubkey: getAta(escrowAddress, token, extra.tokenProgramId),
                    isWritable: true,
                    isSigner: false
                },

                {
                    // 6. associated_token_program
                    pubkey: SolanaAddress.ASSOCIATED_TOKE_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 7. token_program
                    pubkey: extra.tokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 8. rent
                    pubkey: SolanaAddress.SYSVAR_RENT_ID,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 9. system_program
                    pubkey: SolanaAddress.SYSTEM_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                }
            ],
            data
        )
    }

    public withdrawPrivate(
        params: Immutables<SolanaAddress>,
        secret: Buffer,
        extra: {
            /**
             * TokenProgram or TokenProgram 2022
             */
            tokenProgramId: SolanaAddress
        }
    ): Instruction {
        const token = params.token.isNative()
            ? SolanaAddress.WRAPPED_NATIVE
            : params.token
        const data = this.coder.instruction.encode('withdraw', {secret})
        const escrow = this.getEscrowAddress(params)

        return new Instruction(
            this.programId,
            [
                {
                    // 1. taker
                    pubkey: params.taker,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 2. recipient
                    pubkey: params.maker,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 3. dst token
                    pubkey: token,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 4. escrow
                    pubkey: escrow,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 5. escrow_ata
                    pubkey: getAta(escrow, token, extra.tokenProgramId),
                    isSigner: false,
                    isWritable: true
                },
                this.optionalAccount(
                    {
                        // 6. recipient_ata
                        pubkey: getAta(
                            params.maker,
                            params.token,
                            extra.tokenProgramId
                        ),
                        isSigner: false,
                        isWritable: true
                    },
                    params.token.isNative()
                ),
                {
                    // 7. associated_token_program
                    pubkey: SolanaAddress.ASSOCIATED_TOKE_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 8. token_program
                    pubkey: extra.tokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 9. system_program
                    pubkey: SolanaAddress.SYSTEM_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                }
            ],
            data
        )
    }
}
export type EscrowAddressParams = Pick<
    Immutables<SolanaAddress>,
    'orderHash' | 'hashLock' | 'maker' | 'amount'
>
