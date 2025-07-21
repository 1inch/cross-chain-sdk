import {BN, BorshCoder} from '@coral-xyz/anchor'
import assert from 'assert'
import {Immutables} from 'domains/immutables'
import {Instruction} from './instruction'
import {BaseProgram} from './base-program'
import {WhitelistContract} from './whitelist'
import {CreateOrderAccounts} from './types'
import {NetworkEnum} from '../../chains'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {
    AuctionDetails,
    EvmAddress,
    HashLock,
    MerkleLeaf,
    SolanaAddress,
    TimeLocks
} from '../../domains'
import {getAta, getPda} from '../../utils'
import {
    OrderInfoData,
    SvmCrossChainOrder
} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {IDL} from '../../idl/cross-chain-escrow-src'
import {uint256split} from '../../utils/numbers/uint256-split'
import {hashForSolana} from '../../domains/auction-details/hasher'
import {bigintToBN} from '../../utils/numbers/bigint-to-bn'
import {bufferFromHex} from '../../utils/bytes'
import {
    CreateOrderData,
    ParsedCreateInstructionData,
    SolanaEscrowParams,
    SolanaExtra
} from '../../cross-chain-order/svm/types'
import {bnArrayToBigInt} from '../../utils/numbers/bn-array-to-big-int'
import {ResolverCancellationConfig} from '../../cross-chain-order'

export class SvmSrcEscrowFactory extends BaseProgram {
    static DEFAULT = new SvmSrcEscrowFactory(
        new SolanaAddress('2g4JDRMD7G3dK1PHmCnDAycKzd6e5sdhxqGBbs264zwz')
    )

    private static readonly coder = new BorshCoder(IDL)

    constructor(programId: SolanaAddress) {
        super(programId)
    }

    static async parseCreateInstruction(
        ix: Instruction
    ): Promise<ParsedCreateInstructionData> {
        const decodeIx = this.coder.instruction.decode(ix.data) as unknown as {
            name: string
            data: CreateOrderData
        }

        assert(decodeIx, 'cannot decode create instruction')
        assert(decodeIx.name === 'create', 'provided not create instruction')

        const data = decodeIx.data

        const accounts: CreateOrderAccounts = {
            creator: ix.accounts[0].pubkey,
            mint: ix.accounts[1].pubkey,
            creatorAta: ix.accounts[2].pubkey,
            order: ix.accounts[3].pubkey,
            orderAta: ix.accounts[4].pubkey,
            associatedTokenProgram: ix.accounts[5].pubkey,
            tokenProgram: ix.accounts[6].pubkey,
            rent: ix.accounts[7].pubkey,
            systemProgram: ix.accounts[8].pubkey
        }

        const orderInfo: OrderInfoData = {
            srcToken: accounts.mint,
            dstToken: EvmAddress.fromBuffer(
                Buffer.from(data.dstChainParams.token)
            ),
            maker: accounts.creator,
            srcAmount: BigInt(data.amount.toString()),
            minDstAmount: bnArrayToBigInt(data.dstAmount),
            receiver: EvmAddress.fromBuffer(
                Buffer.from(data.dstChainParams.makerAddress)
            )
        }

        const escrowParams: SolanaEscrowParams = {
            hashLock: HashLock.fromBuffer(Buffer.from(data.hashlock)),
            srcChainId: NetworkEnum.SOLANA,
            dstChainId: data.dstChainParams.chainId,
            srcSafetyDeposit: BigInt(data.safetyDeposit.toString()),
            dstSafetyDeposit: BigInt(
                data.dstChainParams.safetyDeposit.toString()
            ),
            timeLocks: TimeLocks.fromBigInt(bnArrayToBigInt(data.timelocks))
        }

        const extraDetails: SolanaExtra = {
            srcAssetIsNative: data.assetsIsNative,
            resolverCancellationConfig: new ResolverCancellationConfig(
                BigInt(data.maxCancellationPremium),
                data.cancellationAuctionDuration
            ),
            allowMultipleFills: data.allowMultipleFills,
            salt: BigInt(data.salt.toString())
        }

        return {
            orderInfo,
            escrowParams,
            extraDetails,
            expirationTime: BigInt(data.expirationTime),
            dutchAuctionDataHash: Buffer.from(data.dutchAuctionDataHash)
        }
    }

    public getOrderAccount(orderHash: Buffer): SolanaAddress {
        return getPda(this.programId, [this.encoder.encode('order'), orderHash])
    }

    public getEscrowAddress(params: EscrowAddressParams): SolanaAddress {
        return getPda(this.programId, [
            this.encoder.encode('escrow'),
            params.orderHash,
            params.hashLock.toBuffer(),
            params.taker.toBuffer(),
            uintAsBeBytes(params.amount, 64)
        ])
    }

    public createOrder(
        order: SvmCrossChainOrder,
        extra: {
            srcTokenProgramId: SolanaAddress
        }
    ): Instruction {
        const data = SvmSrcEscrowFactory.coder.instruction.encode('create', {
            hashlock: order.hashLock.toBuffer(),
            amount: new BN(order.makingAmount.toString()),
            safetyDeposit: new BN(order.srcSafetyDeposit.toString()),
            timelocks: uint256split(order.timeLocks.build()).map(bigintToBN),
            expirationTime: Number(order.deadline),
            assetIsNative: order.srcAssetIsNative,
            dstAmount: uint256split(order.takingAmount).map(bigintToBN),
            dutchAuctionDataHash: hashForSolana(order.auction),
            maxCancellationPremium: new BN(
                order.resolverCancellationConfig.maxCancellationPremium.toString()
            ),
            cancellationAuctionDuration:
                order.resolverCancellationConfig.cancellationAuctionDuration,
            allowMultipleFills: order.multipleFillsAllowed,
            salt: new BN(order.salt.toString()),
            dstChainParams: {
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
        immutables: Immutables<SolanaAddress>,
        auction: AuctionDetails,
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
        const merkleProof = extra.merkleProof || null
        const whitelistProgram = extra.whitelistProgramId
            ? new WhitelistContract(extra.whitelistProgramId)
            : WhitelistContract.DEFAULT

        const data = SvmSrcEscrowFactory.coder.instruction.encode(
            'createEscrow',
            {
                amount: new BN(immutables.amount.toString()),
                dutchAuctionData: {
                    startTime: Number(auction.startTime),
                    duration: Number(auction.duration),
                    initialRateBump: Number(auction.initialRateBump),
                    pointsAndTimeDeltas: auction.points.map((p) => ({
                        rateBump: uintAsBeBytes(BigInt(p.coefficient), 24),
                        timeDelta: p.delay
                    }))
                },
                merkleProof: merkleProof && {
                    proof: merkleProof.proof.map((p) => bufferFromHex(p)),
                    idx: new BN(merkleProof.idx),
                    secretHash: merkleProof.secretHash
                }
            }
        )

        const orderAccount = this.getOrderAccount(immutables.orderHash)
        const escrowAddress = this.getEscrowAddress(immutables)

        return new Instruction(
            this.programId,
            [
                // 1. taker
                {
                    pubkey: immutables.taker,
                    isSigner: true,
                    isWritable: true
                },
                // 2. resolver_access
                {
                    pubkey: whitelistProgram.getAccessAccount(immutables.taker),
                    isSigner: false,
                    isWritable: false
                },
                // 3. maker
                {
                    pubkey: immutables.maker,
                    isSigner: false,
                    isWritable: true
                },
                // 4. mint
                {
                    pubkey: immutables.token,
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
                        immutables.token,
                        extra.tokenProgramId
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
                        immutables.token,
                        extra.tokenProgramId
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
                    pubkey: extra.tokenProgramId,
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
        const data = SvmSrcEscrowFactory.coder.instruction.encode('withdraw', {
            secret
        })
        const escrowAddress = this.getEscrowAddress(params)

        return new Instruction(
            this.programId,
            [
                // 1. taker
                {
                    pubkey: params.taker,
                    isSigner: true,
                    isWritable: true
                },
                // 2. maker asset
                {
                    pubkey: params.token,
                    isSigner: false,
                    isWritable: false
                },
                // 3. escrow
                {
                    pubkey: escrowAddress,
                    isWritable: true,
                    isSigner: false
                },
                // 4. escrow ata
                {
                    pubkey: getAta(
                        escrowAddress,
                        params.token,
                        extra.tokenProgramId
                    ),
                    isSigner: false,
                    isWritable: true
                },
                // 5. taker ata
                {
                    pubkey: getAta(
                        params.taker,
                        params.token,
                        extra.tokenProgramId
                    ),
                    isSigner: false,
                    isWritable: true
                },
                // 6. token_program
                {
                    pubkey: extra.tokenProgramId,
                    isSigner: false,
                    isWritable: false
                },
                // 7. system_program
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ = HashLock // to have ability to refer to it in jsdoc

export type EscrowAddressParams = Pick<
    Immutables<SolanaAddress>,
    'orderHash' | 'hashLock' | 'taker' | 'amount'
>
