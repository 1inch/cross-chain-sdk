export const CROSS_CHAIN_ABI = [
    {
        anonymous: false,
        inputs: [],
        name: 'EscrowCancelled',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address'
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'FundsRescued',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'secret',
                type: 'bytes32'
            }
        ],
        name: 'EscrowWithdrawal',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                components: [
                    {
                        internalType: 'bytes32',
                        name: 'orderHash',
                        type: 'bytes32'
                    },
                    {
                        internalType: 'bytes32',
                        name: 'hashlock',
                        type: 'bytes32'
                    },
                    {internalType: 'address', name: 'maker', type: 'address'},
                    {internalType: 'address', name: 'taker', type: 'address'},
                    {internalType: 'address', name: 'token', type: 'address'},
                    {internalType: 'uint256', name: 'amount', type: 'uint256'},
                    {
                        internalType: 'uint256',
                        name: 'safetyDeposit',
                        type: 'uint256'
                    },
                    {
                        internalType: 'uint256',
                        name: 'timelocks',
                        type: 'uint256'
                    },
                    {internalType: 'bytes', name: 'parameters', type: 'bytes'}
                ],
                indexed: false,
                internalType: 'struct IBaseEscrow.Immutables',
                name: 'srcImmutables',
                type: 'tuple'
            },
            {
                components: [
                    {internalType: 'address', name: 'maker', type: 'address'},
                    {internalType: 'uint256', name: 'amount', type: 'uint256'},
                    {internalType: 'address', name: 'token', type: 'address'},
                    {
                        internalType: 'uint256',
                        name: 'safetyDeposit',
                        type: 'uint256'
                    },
                    {internalType: 'uint256', name: 'chainId', type: 'uint256'},
                    {internalType: 'bytes', name: 'parameters', type: 'bytes'}
                ],
                indexed: false,
                internalType: 'struct IEscrowFactory.DstImmutablesComplement',
                name: 'dstImmutablesComplement',
                type: 'tuple'
            }
        ],
        name: 'SrcEscrowCreated',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'escrow',
                type: 'address'
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'hashlock',
                type: 'bytes32'
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'taker',
                type: 'address'
            }
        ],
        name: 'DstEscrowCreated',
        type: 'event'
    }
]
