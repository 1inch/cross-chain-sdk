import {Address, NetworkEnum} from '@1inch/fusion-sdk'

export const TRUE_ERC20 = {
    // TODO: add correct addresses
    [NetworkEnum.ETHEREUM]: Address.fromBigInt(1n),
    [NetworkEnum.POLYGON]: Address.fromBigInt(1n),
    [NetworkEnum.OPTIMISM]: Address.fromBigInt(1n),
    [NetworkEnum.BINANCE]: Address.fromBigInt(1n),
    [NetworkEnum.AVALANCHE]: Address.fromBigInt(1n),
    [NetworkEnum.COINBASE]: Address.fromBigInt(1n),
    [NetworkEnum.FANTOM]: Address.fromBigInt(1n),
    [NetworkEnum.GNOSIS]: Address.fromBigInt(1n),
    [NetworkEnum.ARBITRUM]: Address.fromBigInt(1n)
}

// todo: update with real contract addresses
export const ESCROW_FACTORY_ADDRESS = Address.fromBigInt(3n)
export const ESCROW_SRC_IMPLEMENTATION_ADDRESS = Address.fromBigInt(1n)
export const ESCROW_DST_IMPLEMENTATION_ADDRESS = Address.fromBigInt(2n)
