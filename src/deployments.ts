import {Address, NetworkEnum} from '@1inch/fusion-sdk'

const TrueERC20 = new Address('0xda0000d4000015a526378bb6fafc650cea5966f8')

export const TRUE_ERC20 = {
    [NetworkEnum.ETHEREUM]: TrueERC20,
    [NetworkEnum.POLYGON]: TrueERC20,
    [NetworkEnum.OPTIMISM]: TrueERC20,
    [NetworkEnum.BINANCE]: TrueERC20,
    [NetworkEnum.AVALANCHE]: TrueERC20,
    [NetworkEnum.COINBASE]: TrueERC20,
    [NetworkEnum.FANTOM]: TrueERC20,
    [NetworkEnum.GNOSIS]: TrueERC20,
    [NetworkEnum.ARBITRUM]: TrueERC20
}

// todo: update with real contract addresses
export const ESCROW_FACTORY_ADDRESS = Address.fromBigInt(3n)
export const ESCROW_SRC_IMPLEMENTATION_ADDRESS = Address.fromBigInt(1n)
export const ESCROW_DST_IMPLEMENTATION_ADDRESS = Address.fromBigInt(2n)
