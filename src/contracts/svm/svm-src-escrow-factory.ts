import {BN, BorshCoder} from '@coral-xyz/anchor'
import {Instruction} from './instruction'
import {BaseProgram} from './base-program'
import {getAta, getPda} from '../../utils'
import {SvmCrossChainOrder} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {SolanaAddress} from '../../domains/addresses'
import {IDL} from '../../idl/cross-chain-escrow-src'
import {uint256split} from '../../utils/numbers/uint256-split'
import {hashForSolana} from '../../domains/auction-details/hasher'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'

export class SvmSrcEscrowFactory extends BaseProgram {
    static DEFAULT = new SvmSrcEscrowFactory(
        new SolanaAddress('2g4JDRMD7G3dK1PHmCnDAycKzd6e5sdhxqGBbs264zwz')
    )

    private readonly coder = new BorshCoder(IDL)

    constructor(programId: SolanaAddress) {
        super(programId)
    }

    public createOrder(
        order: SvmCrossChainOrder,
        extra: {
            srcTokenProgramId: SolanaAddress
        }
    ): Instruction {
        const data = this.coder.instruction.encode('create', {
            hashlock: order.hashLock.toBuffer(),
            amount: new BN(order.makingAmount.toString()),
            safetyDeposit: new BN(order.srcSafetyDeposit.toString()),
            timelocks: uint256split(order.timeLocks.build()).map(bigIntToBN),
            expirationTime: Number(order.deadline),
            assetIsNative: order.srcAssetIsNative,
            dstAmount: uint256split(order.takingAmount).map(bigIntToBN),
            dutchAuctionDataHash: hashForSolana(order.auction),
            maxCancellationPremium: new BN(
                order.resolverCancellationConfig.maxCancellationPremium.toString()
            ),
            cancellationAuctionDuration:
                order.resolverCancellationConfig.cancellationAuctionDuration,
            allowMultipleFills: order.multipleFillsAllowed,
            salt: new BN(order.salt.toString()),
            _dstChainParams: {
                chainId: order.dstChainId,
                makerAddress: order.receiver.toBuffer(),
                token: order.takerAsset.toBuffer(),
                safetyDeposit: new BN(order.srcSafetyDeposit.toString())
            }
        })

        const escrowAddress = getPda(this.programId, [
            this.encoder.encode('escrow'),
            order.getOrderHashBuffer(),
            order.hashLock.toBuffer(),
            order.maker.toBuffer(),
            order.receiver.toBuffer(),
            order.makerAsset.toBuffer(),
            uintAsBeBytes(order.makingAmount, 64),
            uintAsBeBytes(order.srcSafetyDeposit, 64)
        ])

        return new Instruction(
            this.programId,
            [
                // 1. maker
                {pubkey: order.maker, isWritable: true, isSigner: true},
                // 2. src mint
                {
                    pubkey: order.makerAsset,
                    isWritable: false,
                    isSigner: false
                },
                // 3. src_maker_ata
                this.optionalAccount(
                    {
                        pubkey: getAta(
                            order.maker,
                            order.makerAsset,
                            extra.srcTokenProgramId
                        ),
                        isSigner: false,
                        isWritable: true
                    },
                    order.srcAssetIsNative
                ),
                // 4. escrow
                {
                    pubkey: escrowAddress,
                    isSigner: false,
                    isWritable: true
                },
                // 5. escrow_ata
                {
                    pubkey: getAta(
                        escrowAddress,
                        order.makerAsset,
                        extra.srcTokenProgramId
                    ),
                    isSigner: false,
                    isWritable: true
                },
                // 6. associated_token_program
                {
                    pubkey: SolanaAddress.ASSOCIATED_TOKE_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                // 7. token_program
                {
                    pubkey: extra.srcTokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                // 8. rent
                {
                    pubkey: SolanaAddress.SYSVAR_RENT_ID,
                    isSigner: false,
                    isWritable: false
                },
                // 9. system_program
                {
                    pubkey: SolanaAddress.SYSTEM_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                }
            ],
            data
        )
    }
}

function bigIntToBN(i: bigint): BN {
    return new BN(i.toString())
}
