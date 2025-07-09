import {EvmAddress} from '../../../../domains/addresses'

export type AuctionWhitelistItem = {
    address: EvmAddress
    /**
     * Timestamp in sec at which address can start resolving
     */
    allowFrom: bigint
}

export type SettlementSuffixData = {
    whitelist: AuctionWhitelistItem[]
    resolvingStartTime: bigint
}
