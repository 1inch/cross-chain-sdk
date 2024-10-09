import {HttpProviderConnector, NetworkEnum} from '@1inch/fusion-sdk'
import {
    ActiveOrdersResponse,
    EscrowEventAction,
    EscrowEventSide,
    FillStatus,
    OrdersByMakerResponse,
    OrderStatus,
    OrderStatusResponse,
    OrderType,
    PublishedSecretsResponse,
    ReadyToAcceptSecretFills,
    ValidationStatus
} from './types'
import {OrdersApi} from './orders.api'
import {
    ActiveOrdersRequest,
    OrdersByMakerRequest,
    OrderStatusRequest
} from './orders.request'

function createHttpProviderFake<T>(mock: T): HttpProviderConnector {
    return {
        get: jest.fn().mockImplementationOnce(() => {
            return Promise.resolve(mock)
        }),
        post: jest.fn().mockImplementation(() => {
            return Promise.resolve(null)
        })
    }
}

describe(__filename, () => {
    const url = 'https://test.com/orders'

    describe('getActiveOrders', () => {
        it('success', async () => {
            const expected: ActiveOrdersResponse = {
                items: [
                    {
                        quoteId: '6f3dc6f8-33d3-478b-9f70-2f7c2becc488',
                        orderHash:
                            '0x496755a88564d8ded6759dff0252d3e6c3ef1fe42b4fa1bbc3f03bd2674f1078',
                        signature:
                            '0xb6ffc4f4f8500b5f49d2d01bc83efa5750b10f242db3f10f09df51df1fafe6604b35342a2aadc9f10ad14cbaaad9844689a5386c860c31212be3452601eb71de1c',
                        deadline: '2024-04-25T13:27:48.000Z',
                        auctionStartDate: '2024-04-25T13:24:36.000Z',
                        auctionEndDate: '2024-04-25T13:27:36.000Z',
                        remainingMakerAmount: '33058558528525703',
                        makerBalance: '33058558528525703',
                        makerAllowance: '33058558528525703',
                        order: {
                            salt: '102412815596156525137376967412477025111761562902072504909418068904100646989168',
                            maker: '0xe2668d9bef0a686c9874882f7037758b5b520e5c',
                            receiver:
                                '0x0000000000000000000000000000000000000000',
                            makerAsset:
                                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                            takerAsset:
                                '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                            makerTraits:
                                '62419173104490761595518734107493289545375808488163256166876037723686174720000',
                            makingAmount: '33058558528525703',
                            takingAmount: '147681'
                        },
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        fills: [],
                        extension:
                            '0x000000830000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b8400c956a00003e1b662a59940000b40ecaaa002b1d00540e41ea003cfb2809a5314473e1165f6b58018e20ed8f07b8400c956a00003e1b662a59940000b40ecaaa002b1d00540e41ea003cfb2809a5314473e1165f6b58018e20ed8f07b840662a597cd1a23c3abeed63c51b86000008',
                        isMakerContract: false,
                        secretHashes: [
                            '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                            '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                            '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                        ]
                    },
                    {
                        quoteId: '8343588a-da1e-407f-b41f-aa86f0ec4266',
                        orderHash:
                            '0x153386fa8e0b27b09d1250455521531e392e342571de31ac50836a3b6b9001d8',
                        signature:
                            '0x9ef06d325568887caace5f82bba23c821224df23886675fdd63259ee1594269e2768f58fe90a0ae6009184f2f422eb61e9cbd4f6d3c674befd0e55302995d4301c',
                        deadline: '2023-01-31T11:01:06.000Z',
                        auctionStartDate: '2023-01-31T10:58:11.000Z',
                        auctionEndDate: '2023-01-31T11:01:11.000Z',
                        remainingMakerAmount: '470444951856649710700841',
                        makerBalance: '470444951856649710700841',
                        makerAllowance: '470444951856649710700841',
                        order: {
                            salt: '102412815605188492728297784997818915205705878873010401762040598952855113412064',
                            maker: '0xdc8152a435d76fc89ced8255e28f690962c27e52',
                            receiver:
                                '0x0000000000000000000000000000000000000000',
                            makerAsset:
                                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                            takerAsset:
                                '0xdac17f958d2ee523a2206206994597c13d831ec7',
                            makerTraits:
                                '62419173104490761595518734107503940736863610329190665072877236599067968012288',
                            makingAmount: '30000000',
                            takingAmount: '20653338'
                        },
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        extension:
                            '0x00000079000000540000005400000054000000540000002a0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b840423b06000034016627b1dc0000b444e602447208003cfb2809a5314473e1165f6b58018e20ed8f07b840423b06000034016627b1dc0000b444e602447208003cfb2809a5314473e1165f6b58018e20ed8f07b8406627b1c4d1a23c3abeed63c51b86000008',
                        isMakerContract: true,
                        fills: [],
                        secretHashes: [
                            '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                            '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                            '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                        ]
                    }
                ],
                meta: {
                    totalItems: 11,
                    currentPage: 1,
                    itemsPerPage: 2,
                    totalPages: 6
                }
            }

            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const response = await api.getActiveOrders(
                new ActiveOrdersRequest({page: 1, limit: 2})
            )

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/active/?page=1&limit=2`
            )
        })

        it('passes without providing args', async () => {
            const expected = {
                items: [
                    {
                        quoteId: '6f3dc6f8-33d3-478b-9f70-2f7c2becc488',
                        orderHash:
                            '0x496755a88564d8ded6759dff0252d3e6c3ef1fe42b4fa1bbc3f03bd2674f1078',
                        signature:
                            '0xb6ffc4f4f8500b5f49d2d01bc83efa5750b10f242db3f10f09df51df1fafe6604b35342a2aadc9f10ad14cbaaad9844689a5386c860c31212be3452601eb71de1c',
                        deadline: '2024-04-25T13:27:48.000Z',
                        auctionStartDate: '2024-04-25T13:24:36.000Z',
                        auctionEndDate: '2024-04-25T13:27:36.000Z',
                        remainingMakerAmount: '33058558528525703',
                        makerBalance: '33058558528525703',
                        makerAllowance: '33058558528525703',
                        order: {
                            salt: '102412815596156525137376967412477025111761562902072504909418068904100646989168',
                            maker: '0xe2668d9bef0a686c9874882f7037758b5b520e5c',
                            receiver:
                                '0x0000000000000000000000000000000000000000',
                            makerAsset:
                                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                            takerAsset:
                                '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                            makerTraits:
                                '62419173104490761595518734107493289545375808488163256166876037723686174720000',
                            makingAmount: '33058558528525703',
                            takingAmount: '147681'
                        },
                        extension:
                            '0x000000830000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b8400c956a00003e1b662a59940000b40ecaaa002b1d00540e41ea003cfb2809a5314473e1165f6b58018e20ed8f07b8400c956a00003e1b662a59940000b40ecaaa002b1d00540e41ea003cfb2809a5314473e1165f6b58018e20ed8f07b840662a597cd1a23c3abeed63c51b86000008'
                    },
                    {
                        quoteId: '8343588a-da1e-407f-b41f-aa86f0ec4266',
                        orderHash:
                            '0x153386fa8e0b27b09d1250455521531e392e342571de31ac50836a3b6b9001d8',
                        signature:
                            '0x9ef06d325568887caace5f82bba23c821224df23886675fdd63259ee1594269e2768f58fe90a0ae6009184f2f422eb61e9cbd4f6d3c674befd0e55302995d4301c',
                        deadline: '2023-01-31T11:01:06.000Z',
                        auctionStartDate: '2023-01-31T10:58:11.000Z',
                        auctionEndDate: '2023-01-31T11:01:11.000Z',
                        remainingMakerAmount: '470444951856649710700841',
                        makerBalance: '470444951856649710700841',
                        makerAllowance: '470444951856649710700841',
                        order: {
                            salt: '102412815605188492728297784997818915205705878873010401762040598952855113412064',
                            maker: '0xdc8152a435d76fc89ced8255e28f690962c27e52',
                            receiver:
                                '0x0000000000000000000000000000000000000000',
                            makerAsset:
                                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                            takerAsset:
                                '0xdac17f958d2ee523a2206206994597c13d831ec7',
                            makerTraits:
                                '62419173104490761595518734107503940736863610329190665072877236599067968012288',
                            makingAmount: '30000000',
                            takingAmount: '20653338'
                        },
                        extension:
                            '0x00000079000000540000005400000054000000540000002a0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b840423b06000034016627b1dc0000b444e602447208003cfb2809a5314473e1165f6b58018e20ed8f07b840423b06000034016627b1dc0000b444e602447208003cfb2809a5314473e1165f6b58018e20ed8f07b8406627b1c4d1a23c3abeed63c51b86000008'
                    }
                ],
                meta: {
                    totalItems: 11,
                    currentPage: 1,
                    itemsPerPage: 2,
                    totalPages: 6
                }
            }
            const url = 'https://test.com/orders'

            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const response = await api.getActiveOrders()

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/active/?`
            )
        })
    })

    describe('getOrderStatus', () => {
        it('success', async () => {
            const url = 'https://test.com/orders'

            const expected: OrderStatusResponse = {
                order: {
                    salt: '102412815611787935992271873344279698181002251432500613888978521074851540062603',
                    maker: '0xdc8152a435d76fc89ced8255e28f690962c27e52',
                    receiver: '0x0000000000000000000000000000000000000000',
                    makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    makerTraits:
                        '33471150795161712739625987854073848363835857014350031386507831725384548745216',
                    makingAmount: '40000000000000000',
                    takingAmount: '119048031'
                },
                cancelTx: null,
                points: null,
                auctionStartDate: 1713866825,
                auctionDuration: 360,
                initialRateBump: 654927,
                status: OrderStatus.Executed,
                extension:
                    '0x0000006f0000004a0000004a0000004a0000004a000000250000000000000000fb2809a5314473e1165f6b58018e20ed8f07b840000000000000006627884900016809fe4ffb2809a5314473e1165f6b58018e20ed8f07b840000000000000006627884900016809fe4ffb2809a5314473e1165f6b58018e20ed8f07b8406627883dd1a23c3abeed63c51b86000008',
                createdAt: '2024-04-23T10:06:58.807Z',
                fromTokenToUsdPrice: '3164.81348508000019137398',
                toTokenToUsdPrice: '0.99699437304091353962',
                fills: [
                    {
                        status: FillStatus.Executed,
                        txHash: '0x346d2098059da884c61dfb95c357f11abbf51466c7903fe9c0d5a3d8471b8549',
                        filledMakerAmount: '40000000000000000',
                        filledAuctionTakerAmount: '120997216',
                        escrowEvents: [
                            {
                                transactionHash: '0x2345',
                                escrow: '0x123',
                                action: EscrowEventAction.SrcEscrowCreated,
                                blockTimestamp: 123,
                                side: EscrowEventSide.Src
                            },
                            {
                                transactionHash: '0x4234',
                                escrow: '0x234',
                                action: EscrowEventAction.DstEscrowCreated,
                                blockTimestamp: 124,
                                side: EscrowEventSide.Dst
                            },
                            {
                                transactionHash: '0x6454',
                                escrow: '0x123',
                                action: EscrowEventAction.Withdrawn,
                                side: EscrowEventSide.Dst,
                                blockTimestamp: 125
                            },
                            {
                                transactionHash: '0x4354',
                                escrow: '0x234',
                                action: EscrowEventAction.Withdrawn,
                                side: EscrowEventSide.Src,
                                blockTimestamp: 126
                            }
                        ]
                    }
                ],
                isNativeCurrency: false
            }
            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )
            const orderHash = `0x1beee023ab933cf5446c298eadadb61c05705f2156ef5b2db36c160b36f31ce4`

            const response = await api.getOrderStatus(
                new OrderStatusRequest({orderHash})
            )

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/status/${orderHash}`
            )
        })
    })

    describe('getOrdersByMaker', () => {
        it('success', async () => {
            const url = 'https://test.com/orders'

            const expected: OrdersByMakerResponse = {
                meta: {
                    totalItems: 2,
                    currentPage: 1,
                    itemsPerPage: 100,
                    totalPages: 1
                },
                items: [
                    {
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        orderHash:
                            '0x32b666e75a34bd97844017747a3222b0422b5bbce15f1c06913678fcbff84571',
                        makerAsset:
                            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        takerAsset:
                            '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        makerAmount: '30000000',
                        minTakerAmount: '23374478',
                        approximateTakingAmount: '24000000',
                        createdAt: '2024-04-23T11:36:45.980Z',
                        fills: [],
                        status: OrderStatus.Pending,
                        validation: ValidationStatus.Valid,
                        cancelTx: null,
                        isNativeCurrency: false,
                        auctionStartDate: 1713872226,
                        auctionDuration: 180,
                        initialRateBump: 2824245,
                        points: [
                            {
                                coefficient: 2805816,
                                delay: 60
                            }
                        ],
                        cancelable: true
                    },
                    {
                        orderHash:
                            '0x726c96911b867c84880fcacbd4e26205ecee58be72b31e2969987880b53f35f2',
                        makerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        takerAsset:
                            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        makerAmount: '40000000000000000',
                        minTakerAmount: '119048031',
                        approximateTakingAmount: '120000000',
                        createdAt: '2024-04-23T10:06:58.807Z',
                        fills: [
                            {
                                status: FillStatus.Executed,
                                txHash: '0x346d2098059da884c61dfb95c357f11abbf51466c7903fe9c0d5a3d8471b8549',
                                filledMakerAmount: '40000000000000000',
                                filledAuctionTakerAmount: '120997216',
                                escrowEvents: [
                                    {
                                        transactionHash: '0x2345',
                                        escrow: '0x123',
                                        action: EscrowEventAction.SrcEscrowCreated,
                                        blockTimestamp: 123,
                                        side: EscrowEventSide.Src
                                    },
                                    {
                                        transactionHash: '0x4234',
                                        escrow: '0x123',
                                        action: EscrowEventAction.DstEscrowCreated,
                                        blockTimestamp: 124,
                                        side: EscrowEventSide.Dst
                                    },
                                    {
                                        transactionHash: '0x6454',
                                        escrow: '0x123',
                                        action: EscrowEventAction.Withdrawn,
                                        side: EscrowEventSide.Dst,
                                        blockTimestamp: 125
                                    },
                                    {
                                        transactionHash: '0x4354',
                                        escrow: '0x123',
                                        action: EscrowEventAction.Withdrawn,
                                        side: EscrowEventSide.Src,
                                        blockTimestamp: 126
                                    }
                                ]
                            }
                        ],
                        status: OrderStatus.Executed,
                        validation: ValidationStatus.Valid,
                        cancelTx: null,
                        isNativeCurrency: false,
                        auctionStartDate: 1713866825,
                        auctionDuration: 360,
                        initialRateBump: 654927,
                        points: null,
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        cancelable: false
                    }
                ]
            }
            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const address = '0xfa80cd9b3becc0b4403b0f421384724f2810775f'
            const response = await api.getOrdersByMaker(
                new OrdersByMakerRequest({
                    address,
                    limit: 1,
                    page: 1
                })
            )

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/maker/${address}/?limit=1&page=1`
            )
        })

        it('handles the case when no pagination params was passed', async () => {
            const url = 'https://test.com/orders'

            const expected: OrdersByMakerResponse = {
                meta: {
                    totalItems: 2,
                    currentPage: 1,
                    itemsPerPage: 100,
                    totalPages: 1
                },
                items: [
                    {
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        orderHash:
                            '0x32b666e75a34bd97844017747a3222b0422b5bbce15f1c06913678fcbff84571',
                        makerAsset:
                            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        takerAsset:
                            '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        makerAmount: '30000000',
                        minTakerAmount: '23374478',
                        approximateTakingAmount: '24000000',
                        createdAt: '2024-04-23T11:36:45.980Z',
                        fills: [],
                        status: OrderStatus.Pending,
                        validation: ValidationStatus.Valid,
                        cancelTx: null,
                        isNativeCurrency: false,
                        auctionStartDate: 1713872226,
                        auctionDuration: 180,
                        initialRateBump: 2824245,
                        points: [
                            {
                                coefficient: 2805816,
                                delay: 60
                            }
                        ],
                        cancelable: true
                    },
                    {
                        srcChainId: NetworkEnum.ETHEREUM,
                        dstChainId: NetworkEnum.ARBITRUM,
                        orderHash:
                            '0x726c96911b867c84880fcacbd4e26205ecee58be72b31e2969987880b53f35f2',
                        makerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        takerAsset:
                            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        makerAmount: '40000000000000000',
                        minTakerAmount: '119048031',
                        approximateTakingAmount: '120000000',
                        createdAt: '2024-04-23T10:06:58.807Z',
                        fills: [
                            {
                                status: FillStatus.Executed,
                                txHash: '0x346d2098059da884c61dfb95c357f11abbf51466c7903fe9c0d5a3d8471b8549',
                                filledMakerAmount: '40000000000000000',
                                filledAuctionTakerAmount: '120997216',
                                escrowEvents: [
                                    {
                                        transactionHash: '0x2345',
                                        escrow: '0x123',
                                        action: EscrowEventAction.SrcEscrowCreated,
                                        blockTimestamp: 123,
                                        side: EscrowEventSide.Src
                                    },
                                    {
                                        transactionHash: '0x4234',
                                        escrow: '0x123',
                                        action: EscrowEventAction.DstEscrowCreated,
                                        blockTimestamp: 124,
                                        side: EscrowEventSide.Dst
                                    },
                                    {
                                        transactionHash: '0x6454',
                                        escrow: '0x123',
                                        action: EscrowEventAction.Withdrawn,
                                        side: EscrowEventSide.Dst,
                                        blockTimestamp: 125
                                    },
                                    {
                                        transactionHash: '0x4354',
                                        escrow: '0x123',
                                        action: EscrowEventAction.Withdrawn,
                                        side: EscrowEventSide.Src,
                                        blockTimestamp: 126
                                    }
                                ]
                            }
                        ],
                        status: OrderStatus.Executed,
                        validation: ValidationStatus.Valid,
                        cancelTx: null,
                        isNativeCurrency: false,
                        auctionStartDate: 1713866825,
                        auctionDuration: 360,
                        initialRateBump: 654927,
                        points: null,
                        cancelable: true
                    }
                ]
            }

            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const address = '0xfa80cd9b3becc0b4403b0f421384724f2810775f'
            const response = await api.getOrdersByMaker(
                new OrdersByMakerRequest({
                    address
                })
            )

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/maker/${address}/?`
            )
        })
    })

    describe('getReadyToAcceptSecretFills', () => {
        it('success', async () => {
            const url = 'https://test.com/orders'

            const expected: ReadyToAcceptSecretFills = {
                fills: [
                    {
                        idx: 0,
                        srcEscrowDeployTxHash: '0x123',
                        dstEscrowDeployTxHash: '0x456'
                    }
                ]
            }
            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const orderHash =
                '0x035b5c86d29c154e1e677ef1237de6792ff18d5c92964222ee768c77148e0fb7'
            const response = await api.getReadyToAcceptSecretFills(orderHash)

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/ready-to-accept-secret-fills/${orderHash}`
            )
        })
    })

    describe('getPublishedSecrets', () => {
        it('success', async () => {
            const url = 'https://test.com/orders'

            const expected: PublishedSecretsResponse = {
                orderType: OrderType.SingleFill,
                secrets: []
            }
            const httpProvider = createHttpProviderFake(expected)
            const api = new OrdersApi(
                {
                    url
                },
                httpProvider
            )

            const orderHash =
                '0x035b5c86d29c154e1e677ef1237de6792ff18d5c92964222ee768c77148e0fb7'
            const response = await api.getPublishedSecrets(orderHash)

            expect(response).toEqual(expected)
            expect(httpProvider.get).toHaveBeenLastCalledWith(
                `${url}/v1.0/order/secrets/${orderHash}`
            )
        })
    })
})
