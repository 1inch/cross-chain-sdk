import {NetworkEnum} from './chains.js'
import {EvmAddress} from './domains/addresses/index.js'

const TrueERC20 = EvmAddress.fromString(
    '0xda0000d4000015a526378bb6fafc650cea5966f8'
)
const ZKTrueERC20 = EvmAddress.fromString(
    '0xd66097c27eb8dee404bac235737932260edc6f3b'
)
// Robinhood chain uses its own CREATE3 deployer, so addresses differ from other chains
const RobinhoodTrueERC20 = EvmAddress.fromString(
    '0x40c0b7e8018cca1eb8d913b75b1b20cfd89b8d5b'
)
// Monad, Cronos, HyperEVM and Arc use a new deployer, so they share addresses which differ from other chains
const MonadCronosHyperevmArcTrueERC20 = EvmAddress.fromString(
    '0x175a30f81eade2d75b4d1d5fc750131877355d21'
)

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
    [NetworkEnum.ZKSYNC]: ZKTrueERC20,
    [NetworkEnum.LINEA]: TrueERC20,
    [NetworkEnum.SONIC]: TrueERC20,
    [NetworkEnum.UNICHAIN]: TrueERC20,
    [NetworkEnum.ROBINHOOD]: RobinhoodTrueERC20,
    [NetworkEnum.MONAD]: MonadCronosHyperevmArcTrueERC20,
    [NetworkEnum.CRONOS]: MonadCronosHyperevmArcTrueERC20,
    [NetworkEnum.HYPEREVM]: MonadCronosHyperevmArcTrueERC20,
    [NetworkEnum.ARC]: MonadCronosHyperevmArcTrueERC20
}

const ESCROW_FACTORY_ADDRESS = EvmAddress.fromString(
    '0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a'
)
const ESCROW_ZK_FACTORY_ADDRESS = EvmAddress.fromString(
    '0x584aeab186d81dbb52a8a14820c573480c3d4773'
)
const ESCROW_SRC_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0xcd70bf33cfe59759851db21c83ea47b6b83bef6a'
)
const ESCROW_ZK_SRC_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0xddc60c7babfc55d8030f51910b157e179f7a41fc'
)
const ESCROW_DST_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0x9c3e06659f1c34f930ce97fcbce6e04ae88e535b'
)
const ESCROW_ZK_DST_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0xdc4ccc2fc2475d0ed3fddd563c44f2bf6a3900c9'
)
// Robinhood chain uses its own CREATE3 deployer, so addresses differ from other chains
const ESCROW_RH_FACTORY_ADDRESS = EvmAddress.fromString(
    '0xa02b9cc95094bb27d1d041b9fbf09f65a366f7b3'
)
const ESCROW_RH_SRC_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0xb077a4326f1e875c21d74028a1499eafcee43bf3'
)
const ESCROW_RH_DST_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0x104f09ea1f9c09662635ad581d0bef8b15d16f4f'
)
// Monad, Cronos, HyperEVM and Arc use a new deployer, so they share addresses which differ from other chains
const ESCROW_MCHA_FACTORY_ADDRESS = EvmAddress.fromString(
    '0x9e010857ed5aaa4fca6d5404f7c7c54b1bbb8ad2'
)
const ESCROW_MCHA_SRC_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0x57f60782d58614fa2ee95f57f809d1b7a9e5a1cd'
)
const ESCROW_MCHA_DST_IMPLEMENTATION_ADDRESS = EvmAddress.fromString(
    '0x7b1bfa2a3227b1dbfc886da843b527bd3e79864a'
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
    [NetworkEnum.ARBITRUM]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ZKSYNC]: ESCROW_ZK_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.LINEA]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.SONIC]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.UNICHAIN]: ESCROW_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ROBINHOOD]: ESCROW_RH_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.MONAD]: ESCROW_MCHA_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.CRONOS]: ESCROW_MCHA_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.HYPEREVM]: ESCROW_MCHA_SRC_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ARC]: ESCROW_MCHA_SRC_IMPLEMENTATION_ADDRESS
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
    [NetworkEnum.ARBITRUM]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ZKSYNC]: ESCROW_ZK_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.LINEA]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.SONIC]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.UNICHAIN]: ESCROW_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ROBINHOOD]: ESCROW_RH_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.MONAD]: ESCROW_MCHA_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.CRONOS]: ESCROW_MCHA_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.HYPEREVM]: ESCROW_MCHA_DST_IMPLEMENTATION_ADDRESS,
    [NetworkEnum.ARC]: ESCROW_MCHA_DST_IMPLEMENTATION_ADDRESS
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
    [NetworkEnum.ARBITRUM]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.ZKSYNC]: ESCROW_ZK_FACTORY_ADDRESS,
    [NetworkEnum.LINEA]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.SONIC]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.UNICHAIN]: ESCROW_FACTORY_ADDRESS,
    [NetworkEnum.ROBINHOOD]: ESCROW_RH_FACTORY_ADDRESS,
    [NetworkEnum.MONAD]: ESCROW_MCHA_FACTORY_ADDRESS,
    [NetworkEnum.CRONOS]: ESCROW_MCHA_FACTORY_ADDRESS,
    [NetworkEnum.HYPEREVM]: ESCROW_MCHA_FACTORY_ADDRESS,
    [NetworkEnum.ARC]: ESCROW_MCHA_FACTORY_ADDRESS
}
