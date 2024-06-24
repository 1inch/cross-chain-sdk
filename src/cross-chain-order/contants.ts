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
