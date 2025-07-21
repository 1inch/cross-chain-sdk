import {BN, BorshCoder, web3} from '@coral-xyz/anchor'
import assert from 'assert'
import {Buffer} from 'buffer'
import {Instruction} from './instruction'
import {BaseProgram} from './base-program'
import {WhitelistContract} from './whitelist'
import {ParsedCreateDstEscrowInstructionData} from './types'
import {bigintToBN} from '../../utils/numbers/bigint-to-bn'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {uint256split} from '../../utils/numbers/uint256-split'
import {getAta, getPda} from '../../utils'
import {
    EvmAddress,
    HashLock,
    Immutables,
    SolanaAddress,
    TimeLocks
} from '../../domains'
import {IDL} from '../../idl/cross-chain-escrow-dst'
import {FixedLengthArray} from '../../type-utils'
import {bufferToHex} from '../../utils/bytes'
import {bnArrayToBigInt} from '../../utils/numbers/bn-array-to-big-int'

export class SvmDstEscrowFactory extends BaseProgram {
    static DEFAULT = new SvmDstEscrowFactory(
        new SolanaAddress('GveV3ToLhvRmeq1Fyg3BMkNetZuG9pZEp4uBGWLrTjve')
    )

    private static readonly coder = new BorshCoder(IDL)

    constructor(programId: SolanaAddress) {
        super(programId)
    }

    static parseCreateEscrowInstruction(
        ix: Instruction
    ): ParsedCreateDstEscrowInstructionData {
        const decoded = SvmDstEscrowFactory.coder.instruction.decode(
            ix.data
        ) as {
            name: string
            data: {
                orderHash: FixedLengthArray<number, 32>
                hashlock: FixedLengthArray<number, 32>
                amount: BN
                safetyDeposit: BN
                recipient: web3.PublicKey
                timelocks: FixedLengthArray<BN, 4>
                srcCancellationTimestamp: number
                assetIsNative: boolean
            }
        }

        assert(decoded, 'cannot decode create instruction')
        assert(decoded.name === 'create', 'not create instruction')

        const data = decoded.data

        return {
            orderHash: bufferToHex(data.orderHash),
            hashlock: HashLock.fromString(bufferToHex(data.hashlock)),
            amount: BigInt(data.amount.toString()),
            safetyDeposit: BigInt(data.safetyDeposit.toString()),
            recipient: EvmAddress.fromBuffer(data.recipient.toBuffer()),
            timelocks: TimeLocks.fromBigInt(bnArrayToBigInt(data.timelocks)),
            srcCancellationTimestamp: data.srcCancellationTimestamp,
            assetIsNative: data.assetIsNative
        }
    }

    static parsePrivateWithdrawInstruction(ix: Instruction): {secret: string} {
        const decoded = this.coder.instruction.decode(ix.data) as {
            name: string
            data: {secret: FixedLengthArray<number, 32>}
        }

        assert(decoded, 'cannot decode withdraw instruction')
        assert(decoded.name === 'withdraw', 'not withdraw instruction')

        return {
            secret: bufferToHex(decoded.data.secret)
        }
    }

    static parsePublicWithdrawInstruction(ix: Instruction): {secret: string} {
        const decoded = this.coder.instruction.decode(ix.data) as {
            name: string
            data: {secret: FixedLengthArray<number, 32>}
        }

        assert(decoded, 'cannot decode publicWithdraw instruction')
        assert(
            decoded.name === 'publicWithdraw',
            'not publicWithdraw instruction'
        )

        return {
            secret: bufferToHex(decoded.data.secret)
        }
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

        const data = SvmDstEscrowFactory.coder.instruction.encode('create', {
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
        const data = SvmDstEscrowFactory.coder.instruction.encode('withdraw', {
            secret
        })
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

    public withdrawPublic(
        params: Immutables<SolanaAddress>,
        secret: Buffer,
        payer: SolanaAddress,
        extra: {
            /**
             * If not passed, than `WhitelistContract.DEFAULT` will be used
             * @see WhitelistContract.DEFAULT
             */
            whitelistProgramId?: SolanaAddress
            /**
             * TokenProgram or TokenProgram 2022
             */
            tokenProgramId: SolanaAddress
        }
    ): Instruction {
        const whitelistProgram = extra.whitelistProgramId
            ? new WhitelistContract(extra.whitelistProgramId)
            : WhitelistContract.DEFAULT

        const token = params.token.isNative()
            ? SolanaAddress.WRAPPED_NATIVE
            : params.token
        const data = SvmDstEscrowFactory.coder.instruction.encode(
            'publicWithdraw',
            {secret}
        )
        const escrow = this.getEscrowAddress(params)

        return new Instruction(
            this.programId,
            [
                {
                    // 1. creator
                    pubkey: params.taker,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 2. recipient
                    pubkey: params.maker,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 3. payer
                    pubkey: payer,
                    isSigner: true,
                    isWritable: true
                },
                {
                    // 4. resolver_access
                    pubkey: whitelistProgram.getAccessAccount(payer),
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 5. mint
                    pubkey: token,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 6. escrow
                    pubkey: escrow,
                    isSigner: false,
                    isWritable: true
                },
                {
                    // 7. escrow_ata
                    pubkey: getAta(escrow, token, extra.tokenProgramId),
                    isSigner: false,
                    isWritable: true
                },
                this.optionalAccount(
                    {
                        // 8. recipient_ata
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
                    // 9. associated_token_program
                    pubkey: SolanaAddress.ASSOCIATED_TOKE_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 10. token_program
                    pubkey: extra.tokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    // 11. system_program
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
