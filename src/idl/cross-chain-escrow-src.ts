import {WritableDeep} from 'type-fest'
const _IDL = {
    address: '2g4JDRMD7G3dK1PHmCnDAycKzd6e5sdhxqGBbs264zwz',
    metadata: {
        name: 'crossChainEscrowSrc',
        version: '0.1.0',
        spec: '0.1.0',
        description: 'Created with Anchor'
    },
    instructions: [
        {
            name: 'cancelEscrow',
            discriminator: [156, 203, 54, 179, 38, 72, 33, 21],
            accounts: [
                {name: 'taker', writable: true, signer: true},
                {name: 'maker', writable: true},
                {name: 'mint'},
                {
                    name: 'escrow',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {
                                kind: 'account',
                                path: 'escrow.orderHash',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.hashlock',
                                account: 'escrowSrc'
                            },
                            {kind: 'account', path: 'taker'},
                            {
                                kind: 'account',
                                path: 'escrow.amount',
                                account: 'escrowSrc'
                            }
                        ]
                    }
                },
                {
                    name: 'escrowAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'makerAta',
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'maker'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: []
        },
        {
            name: 'cancelOrder',
            discriminator: [95, 129, 237, 240, 8, 49, 223, 132],
            accounts: [
                {
                    name: 'creator',
                    docs: ['Account that created the order'],
                    writable: true,
                    signer: true
                },
                {name: 'mint'},
                {
                    name: 'order',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'const', value: [111, 114, 100, 101, 114]},
                            {
                                kind: 'account',
                                path: 'order.orderHash',
                                account: 'order'
                            }
                        ]
                    }
                },
                {
                    name: 'orderAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'order'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'creatorAta',
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'creator'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: []
        },
        {
            name: 'cancelOrderByResolver',
            discriminator: [21, 141, 34, 234, 210, 108, 56, 236],
            accounts: [
                {
                    name: 'resolver',
                    docs: ['Account that cancels the escrow'],
                    writable: true,
                    signer: true
                },
                {
                    name: 'resolverAccess',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'resolver'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                170, 5, 244, 79, 146, 16, 119, 74, 230, 143, 46,
                                226, 18, 94, 39, 74, 77, 83, 134, 201, 103, 219,
                                237, 226, 10, 41, 63, 132, 147, 102, 240, 110
                            ]
                        }
                    }
                },
                {name: 'creator', writable: true},
                {name: 'mint'},
                {
                    name: 'order',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'const', value: [111, 114, 100, 101, 114]},
                            {
                                kind: 'account',
                                path: 'order.orderHash',
                                account: 'order'
                            }
                        ]
                    }
                },
                {
                    name: 'orderAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'order'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'creatorAta',
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'creator'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [{name: 'rewardLimit', type: 'u64'}]
        },
        {
            name: 'create',
            discriminator: [24, 30, 200, 40, 5, 28, 7, 119],
            accounts: [
                {name: 'creator', writable: true, signer: true},
                {name: 'mint'},
                {
                    name: 'creatorAta',
                    docs: [
                        "Account to store creator's tokens (Optional if the token is native)"
                    ],
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'creator'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'order',
                    docs: ['Account to store order details'],
                    writable: true
                },
                {
                    name: 'orderAta',
                    docs: ['Account to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'order'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'associatedTokenProgram',
                    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
                },
                {name: 'tokenProgram'},
                {
                    name: 'rent',
                    address: 'SysvarRent111111111111111111111111111111111'
                },
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [
                {name: 'hashlock', type: {array: ['u8', 32]}},
                {name: 'amount', type: 'u64'},
                {name: 'safetyDeposit', type: 'u64'},
                {name: 'timelocks', type: {array: ['u64', 4]}},
                {name: 'expirationTime', type: 'u32'},
                {name: 'assetIsNative', type: 'bool'},
                {name: 'dstAmount', type: {array: ['u64', 4]}},
                {name: 'dutchAuctionDataHash', type: {array: ['u8', 32]}},
                {name: 'maxCancellationPremium', type: 'u64'},
                {name: 'cancellationAuctionDuration', type: 'u32'},
                {name: 'allowMultipleFills', type: 'bool'},
                {name: 'salt', type: 'u64'},
                {
                    name: 'dstChainParams',
                    type: {defined: {name: 'dstChainParams'}}
                }
            ]
        },
        {
            name: 'createEscrow',
            discriminator: [253, 215, 165, 116, 36, 108, 68, 80],
            accounts: [
                {name: 'taker', writable: true, signer: true},
                {
                    name: 'resolverAccess',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'taker'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                170, 5, 244, 79, 146, 16, 119, 74, 230, 143, 46,
                                226, 18, 94, 39, 74, 77, 83, 134, 201, 103, 219,
                                237, 226, 10, 41, 63, 132, 147, 102, 240, 110
                            ]
                        }
                    }
                },
                {name: 'maker', writable: true},
                {name: 'mint'},
                {
                    name: 'order',
                    docs: ['Account to store order details'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'const', value: [111, 114, 100, 101, 114]},
                            {
                                kind: 'account',
                                path: 'order.orderHash',
                                account: 'order'
                            }
                        ]
                    }
                },
                {
                    name: 'orderAta',
                    docs: ['Account to store orders tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'order'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'escrow',
                    docs: ['Account to store escrow details'],
                    writable: true
                },
                {
                    name: 'escrowAta',
                    docs: ['Account to store escrowed tokens'],
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'associatedTokenProgram',
                    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    docs: [
                        'System program required for account initialization'
                    ],
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [
                {name: 'amount', type: 'u64'},
                {
                    name: 'dutchAuctionData',
                    type: {defined: {name: 'auctionData'}}
                },
                {
                    name: 'merkleProof',
                    type: {option: {defined: {name: 'merkleProof'}}}
                }
            ]
        },
        {
            name: 'publicCancelEscrow',
            discriminator: [170, 254, 78, 87, 31, 84, 118, 13],
            accounts: [
                {name: 'taker', writable: true},
                {name: 'maker', writable: true},
                {name: 'mint'},
                {name: 'payer', writable: true, signer: true},
                {
                    name: 'resolverAccess',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'payer'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                170, 5, 244, 79, 146, 16, 119, 74, 230, 143, 46,
                                226, 18, 94, 39, 74, 77, 83, 134, 201, 103, 219,
                                237, 226, 10, 41, 63, 132, 147, 102, 240, 110
                            ]
                        }
                    }
                },
                {
                    name: 'escrow',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {
                                kind: 'account',
                                path: 'escrow.orderHash',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.hashlock',
                                account: 'escrowSrc'
                            },
                            {kind: 'account', path: 'taker'},
                            {
                                kind: 'account',
                                path: 'escrow.amount',
                                account: 'escrowSrc'
                            }
                        ]
                    }
                },
                {
                    name: 'escrowAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'makerAta',
                    writable: true,
                    optional: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'account',
                                path: 'escrow.maker',
                                account: 'escrowSrc'
                            },
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: []
        },
        {
            name: 'publicWithdraw',
            discriminator: [152, 57, 240, 192, 82, 35, 150, 11],
            accounts: [
                {name: 'taker', writable: true},
                {name: 'payer', writable: true, signer: true},
                {
                    name: 'resolverAccess',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'payer'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                170, 5, 244, 79, 146, 16, 119, 74, 230, 143, 46,
                                226, 18, 94, 39, 74, 77, 83, 134, 201, 103, 219,
                                237, 226, 10, 41, 63, 132, 147, 102, 240, 110
                            ]
                        }
                    }
                },
                {name: 'mint'},
                {
                    name: 'escrow',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {
                                kind: 'account',
                                path: 'escrow.orderHash',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.hashlock',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.taker',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.amount',
                                account: 'escrowSrc'
                            }
                        ]
                    }
                },
                {
                    name: 'escrowAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'takerAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'taker'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [{name: 'secret', type: {array: ['u8', 32]}}]
        },
        {
            name: 'rescueFundsForEscrow',
            discriminator: [108, 69, 109, 199, 147, 156, 135, 197],
            accounts: [
                {name: 'taker', writable: true, signer: true},
                {name: 'mint'},
                {
                    name: 'escrow',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {kind: 'arg', path: 'orderHash'},
                            {kind: 'arg', path: 'hashlock'},
                            {kind: 'account', path: 'taker'},
                            {kind: 'arg', path: 'amount'}
                        ]
                    }
                },
                {
                    name: 'escrowAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'takerAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'taker'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [
                {name: 'orderHash', type: {array: ['u8', 32]}},
                {name: 'hashlock', type: {array: ['u8', 32]}},
                {name: 'amount', type: 'u64'},
                {name: 'rescueAmount', type: 'u64'}
            ]
        },
        {
            name: 'rescueFundsForOrder',
            discriminator: [138, 213, 62, 190, 122, 102, 43, 255],
            accounts: [
                {name: 'resolver', writable: true, signer: true},
                {
                    name: 'resolverAccess',
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [
                                    114, 101, 115, 111, 108, 118, 101, 114, 95,
                                    97, 99, 99, 101, 115, 115
                                ]
                            },
                            {kind: 'account', path: 'resolver'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                170, 5, 244, 79, 146, 16, 119, 74, 230, 143, 46,
                                226, 18, 94, 39, 74, 77, 83, 134, 201, 103, 219,
                                237, 226, 10, 41, 63, 132, 147, 102, 240, 110
                            ]
                        }
                    }
                },
                {name: 'mint'},
                {name: 'order'},
                {
                    name: 'orderAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'order'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'resolverAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'resolver'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [
                {name: 'hashlock', type: {array: ['u8', 32]}},
                {name: 'maker', type: 'pubkey'},
                {name: 'token', type: 'pubkey'},
                {name: 'orderAmount', type: 'u64'},
                {name: 'safetyDeposit', type: 'u64'},
                {name: 'timelocks', type: {array: ['u64', 4]}},
                {name: 'expirationTime', type: 'u32'},
                {name: 'assetIsNative', type: 'bool'},
                {name: 'dstAmount', type: {array: ['u64', 4]}},
                {name: 'dutchAuctionDataHash', type: {array: ['u8', 32]}},
                {name: 'maxCancellationPremium', type: 'u64'},
                {name: 'cancellationAuctionDuration', type: 'u32'},
                {name: 'allowMultipleFills', type: 'bool'},
                {name: 'salt', type: 'u64'},
                {name: 'rescueAmount', type: 'u64'}
            ]
        },
        {
            name: 'withdraw',
            discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
            accounts: [
                {name: 'taker', writable: true, signer: true},
                {name: 'mint'},
                {
                    name: 'escrow',
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: 'const',
                                value: [101, 115, 99, 114, 111, 119]
                            },
                            {
                                kind: 'account',
                                path: 'escrow.orderHash',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.hashlock',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.taker',
                                account: 'escrowSrc'
                            },
                            {
                                kind: 'account',
                                path: 'escrow.amount',
                                account: 'escrowSrc'
                            }
                        ]
                    }
                },
                {
                    name: 'escrowAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'escrow'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {
                    name: 'takerAta',
                    writable: true,
                    pda: {
                        seeds: [
                            {kind: 'account', path: 'taker'},
                            {kind: 'account', path: 'tokenProgram'},
                            {kind: 'account', path: 'mint'}
                        ],
                        program: {
                            kind: 'const',
                            value: [
                                140, 151, 37, 143, 78, 36, 137, 241, 187, 61,
                                16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
                                255, 16, 132, 4, 142, 123, 216, 219, 233, 248,
                                89
                            ]
                        }
                    }
                },
                {name: 'tokenProgram'},
                {
                    name: 'systemProgram',
                    address: '11111111111111111111111111111111'
                }
            ],
            args: [{name: 'secret', type: {array: ['u8', 32]}}]
        }
    ],
    accounts: [
        {name: 'escrowSrc', discriminator: [20, 99, 59, 16, 41, 43, 24, 104]},
        {name: 'order', discriminator: [134, 173, 223, 185, 77, 86, 28, 51]},
        {
            name: 'resolverAccess',
            discriminator: [32, 2, 74, 248, 174, 108, 70, 156]
        }
    ],
    types: [
        {
            name: 'auctionData',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'startTime', type: 'u32'},
                    {name: 'duration', type: 'u32'},
                    {name: 'initialRateBump', type: {defined: {name: 'u24'}}},
                    {
                        name: 'pointsAndTimeDeltas',
                        type: {vec: {defined: {name: 'pointAndTimeDelta'}}}
                    }
                ]
            }
        },
        {
            name: 'dstChainParams',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'chainId', type: 'u32'},
                    {name: 'makerAddress', type: {array: ['u8', 32]}},
                    {name: 'token', type: {array: ['u8', 32]}},
                    {name: 'safetyDeposit', type: 'u128'}
                ]
            }
        },
        {
            name: 'escrowSrc',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'orderHash', type: {array: ['u8', 32]}},
                    {name: 'hashlock', type: {array: ['u8', 32]}},
                    {name: 'maker', type: 'pubkey'},
                    {name: 'taker', type: 'pubkey'},
                    {name: 'token', type: 'pubkey'},
                    {name: 'amount', type: 'u64'},
                    {name: 'safetyDeposit', type: 'u64'},
                    {name: 'timelocks', type: {array: ['u64', 4]}},
                    {name: 'assetIsNative', type: 'bool'},
                    {name: 'dstAmount', type: {array: ['u64', 4]}},
                    {name: 'bump', type: 'u8'}
                ]
            }
        },
        {
            name: 'merkleProof',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'proof', type: {vec: {array: ['u8', 32]}}},
                    {name: 'index', type: 'u64'},
                    {name: 'hashedSecret', type: {array: ['u8', 32]}}
                ]
            }
        },
        {
            name: 'order',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'orderHash', type: {array: ['u8', 32]}},
                    {name: 'hashlock', type: {array: ['u8', 32]}},
                    {name: 'creator', type: 'pubkey'},
                    {name: 'token', type: 'pubkey'},
                    {name: 'amount', type: 'u64'},
                    {name: 'remainingAmount', type: 'u64'},
                    {name: 'safetyDeposit', type: 'u64'},
                    {name: 'timelocks', type: {array: ['u64', 4]}},
                    {name: 'expirationTime', type: 'u32'},
                    {name: 'assetIsNative', type: 'bool'},
                    {name: 'dstAmount', type: {array: ['u64', 4]}},
                    {name: 'dutchAuctionDataHash', type: {array: ['u8', 32]}},
                    {name: 'maxCancellationPremium', type: 'u64'},
                    {name: 'cancellationAuctionDuration', type: 'u32'},
                    {name: 'allowMultipleFills', type: 'bool'},
                    {name: 'bump', type: 'u8'}
                ]
            }
        },
        {
            name: 'pointAndTimeDelta',
            type: {
                kind: 'struct',
                fields: [
                    {name: 'rateBump', type: {defined: {name: 'u24'}}},
                    {name: 'timeDelta', type: 'u16'}
                ]
            }
        },
        {
            name: 'resolverAccess',
            type: {kind: 'struct', fields: [{name: 'bump', type: 'u8'}]}
        },
        {name: 'u24', type: {kind: 'struct', fields: [{array: ['u8', 3]}]}}
    ]
} as const
export const IDL: WritableDeep<typeof _IDL> = _IDL as WritableDeep<typeof _IDL>
