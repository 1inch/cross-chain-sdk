import {isSolana, isSupportedChain, NetworkEnum} from './chains.js'
import {
    SOLANA_DST_ESCROW,
    SOLANA_SRC_ESCROW,
    SOLANA_WHITELIST
} from './idl/index.js'
import * as SdkIndex from './sdk/index.js'
import * as WsIndex from './ws-api/index.js'
import * as TypeUtils from './type-utils.js'
import * as SdkTypes from './sdk/types.js'
import * as ImmutablesTypes from './domains/immutables/types.js'
import * as ImmutablesFeesTypes from './domains/immutables-fees/types.js'

describe('module barrels and chain helpers', () => {
    it('loads generated Solana IDLs', () => {
        expect(SOLANA_DST_ESCROW.address).toBeDefined()
        expect(SOLANA_SRC_ESCROW.address).toBeDefined()
        expect(SOLANA_WHITELIST.address).toBeDefined()
    })

    it('re-exports the SDK and websocket entry points', () => {
        expect(SdkIndex.SDK).toBeDefined()
        expect(WsIndex.WebSocketApi).toBeDefined()
        expect(TypeUtils).toBeDefined()
        expect(SdkTypes).toBeDefined()
        expect(ImmutablesTypes).toBeDefined()
        expect(ImmutablesFeesTypes).toBeDefined()
    })

    it('classifies supported and Solana chains', () => {
        expect(isSupportedChain(NetworkEnum.ETHEREUM)).toBe(true)
        expect(isSupportedChain(99999)).toBe(false)
        expect(isSolana(NetworkEnum.SOLANA)).toBe(true)
        expect(isSolana(NetworkEnum.ETHEREUM)).toBe(false)
    })
})
