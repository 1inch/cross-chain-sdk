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
    [NetworkEnum.ARBITRUM]: TrueERC20,
    [NetworkEnum.ZKSYNC]: TrueERC20
}

const ESCROW_FACTORY_ADDRESS = new Address(
    '0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a'
)
const ESCROW_SRC_IMPLEMENTATION_ADDRESS = new Address(
    '0xcd70bf33cfe59759851db21c83ea47b6b83bef6a'
)
const ESCROW_DST_IMPLEMENTATION_ADDRESS = new Address(
    '0x9c3e06659f1c34f930ce97fcbce6e04ae88e535b'
)

export const ESCROW_SRC_IMPLEMENTATION = {
    [NetworkEnum.ETHEREUM]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.POLYGON]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.OPTIMISM]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.BINANCE]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.AVALANCHE]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.COINBASE]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.FANTOM]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.GNOSIS]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ARBITRUM]: ESCROW_SRC_IMPLEMENTATION_ADDRESS
}

export const ESCROW_DST_IMPLEMENTATION = {
    [NetworkEnum.ETHEREUM]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.POLYGON]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.OPTIMISM]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.BINANCE]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.AVALANCHE]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.COINBASE]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.FANTOM]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.GNOSIS]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ARBITRUM]: ESCROW_DST_IMPLEMENTATION_ADDRESS
}

export const ESCROW_FACTORY = {
    [NetworkEnum.ETHEREUM]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.POLYGON]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.OPTIMISM]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.BINANCE]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.AVALANCHE]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.COINBASE]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.FANTOM]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.GNOSIS]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.ARBITRUM]: ESCROW_FACTORY_ADDRESS
}
