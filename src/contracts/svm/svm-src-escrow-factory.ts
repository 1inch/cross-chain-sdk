import {BN, BorshCoder} from '@coral-xyz/anchor'
import {Instruction} from './instruction'
import {BaseProgram} from './base-program'
import {WhitelistContract} from './whitelist'
import {HashLock, MerkleLeaf, SolanaAddress} from '../../domains'
import {getAta} from '../../utils'
import {SvmCrossChainOrder} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {IDL} from '../../idl/cross-chain-escrow-src'
import {uint256split} from '../../utils/numbers/uint256-split'
import {hashForSolana} from '../../domains/auction-details/hasher'

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

        const orderAccount = order.getOrderAccount(this.programId)

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
                // 4. order
                {
                    pubkey: orderAccount,
                    isSigner: false,
                    isWritable: true
                },
                // 5. order_ata
                {
                    pubkey: getAta(
                        orderAccount,
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

    public createEscrow(
        order: SvmCrossChainOrder,
        fillAmount: bigint,
        extra: {
            /**
             * Who will sign tx
             */
            taker: SolanaAddress
            /**
             * If not passed, than `WhitelistContract.DEFAULT` will be used
             * @see WhitelistContract.DEFAULT
             */
            whitelistProgramId?: SolanaAddress
            /**
             * TokenProgram or TokenProgram 2022
             */
            srcTokenProgramId: SolanaAddress
            /**
             * Required if order allows partial fills
             */
            merkleProof?: {
                /**
                 * Merkle proof for index `idx`
                 *
                 * @see HashLock.getProof
                 */
                proof: MerkleLeaf[]
                /**
                 * @see SvmCrossChainOrder.getMultipleFillIdx
                 */
                idx: number
                /**
                 * Hash of secret at index `idx`
                 */
                secretHash: Buffer
            }
        }
    ): Instruction {
        const {merkleProof} = extra
        const whitelistProgram = extra.whitelistProgramId
            ? new WhitelistContract(extra.whitelistProgramId)
            : WhitelistContract.DEFAULT

        const data = this.coder.instruction.encode('createEscrow', {
            fillAmount: new BN(fillAmount.toString()),
            auction: {
                startTime: Number(order.auction.startTime),
                duration: Number(order.auction.duration),
                initialRateBump: Number(order.auction.initialRateBump),
                pointsAndTimeDeltas: order.auction.points.map((p) => ({
                    rateBump: p.coefficient,
                    timeDelta: p.delay
                }))
            },
            merkleProof: merkleProof && {
                proof: merkleProof.proof.map((p) => Buffer.from(p.slice(2))),
                idx: new BN(merkleProof.idx),
                secretHash: merkleProof.secretHash
            }
        })

        const orderAccount = order.getOrderAccount(this.programId)
        const escrowAddress = order.getEscrowAddress(
            this.programId,
            extra.taker,
            merkleProof?.secretHash
        )

        return new Instruction(
            this.programId,
            [
                // 1. taker
                {
                    pubkey: extra.taker,
                    isSigner: true,
                    isWritable: true
                },
                // 2. resolver_access
                {
                    pubkey: whitelistProgram.getAccessAccount(extra.taker),
                    isSigner: false,
                    isWritable: false
                },
                // 3. maker
                {
                    pubkey: order.maker,
                    isSigner: false,
                    isWritable: true
                },
                // 4. mint
                {
                    pubkey: order.makerAsset,
                    isSigner: false,
                    isWritable: false
                },
                // 5. order
                {
                    pubkey: orderAccount,
                    isSigner: false,
                    isWritable: true
                },
                // 6. order ata
                {
                    pubkey: getAta(
                        orderAccount,
                        order.makerAsset,
                        extra.srcTokenProgramId
                    ),
                    isSigner: false,
                    isWritable: true
                },
                // 7. escrow
                {
                    pubkey: escrowAddress,
                    isSigner: false,
                    isWritable: true
                },
                // 8. escrow ata
                {
                    pubkey: getAta(
                        escrowAddress,
                        order.makerAsset,
                        extra.srcTokenProgramId
                    ),
                    isSigner: false,
                    isWritable: true
                },
                // 9. associated_token_program
                {
                    pubkey: SolanaAddress.ASSOCIATED_TOKE_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                // 10. token_program
                {
                    pubkey: extra.srcTokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                // 11. system_program
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ = HashLock // to have ability to refer to it in jsdoc
