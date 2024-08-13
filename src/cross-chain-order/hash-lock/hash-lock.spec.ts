import {getBytesCount} from '@1inch/byte-utils'
import {HashLock} from './hash-lock'

describe('HashLock', () => {
    it('should create single fill HashLock', () => {
        expect(
            HashLock.forSingleFill(
                '0x531d1d2d7a594f1c7e413b074c7b693161486b5c495d457748144a01795c6a45'
            ).toString()
        ).toEqual(
            '0x9f65fdcf781d4320c2dde70da02a1fe916d595dc1817149cc4758fd6a4bfd830'
        )
    })

    it('should create multiple fill HashLock', () => {
        const secrets = [
            '0x531d1d2d7a594f1c7e413b074c7b693161486b5c495d457748144a01795c6a45',
            '0x657812136b5000651d5e18516d764b5e661a681c760d3c3c4c15751020757823',
            '0x62071a322351281f04756576270c362a6e5b395e3b0f68027f231141555c3d43'
        ]

        const leaves = HashLock.getMerkleLeaves(secrets)
        expect(HashLock.forMultipleFills(leaves).toString()).toEqual(
            '0x000292766d9172e4b4983ee4d4b6d511cdbcbef175c7e3e1b1554d513e1ab724'
        )
    })

    it('should be bytes32', () => {
        const secrets = [
            '0x6466643931343237333333313437633162386632316365646666323931643738',
            '0x3131353932633266343034343466363562333230313837353438356463616130',
            '0x6634376135663837653765303462346261616566383430303662303336386635'
        ]

        const leaves = HashLock.getMerkleLeaves(secrets)

        expect(
            getBytesCount(HashLock.forMultipleFills(leaves).toString())
        ).toEqual(32n)
    })

    it('should return proof', () => {
        const secrets = [
            '0x6466643931343237333333313437633162386632316365646666323931643738',
            '0x3131353932633266343034343466363562333230313837353438356463616130',
            '0x6634376135663837653765303462346261616566383430303662303336386635'
        ]

        const leaves = HashLock.getMerkleLeaves(secrets)

        expect(HashLock.getProof(leaves, 0)).toEqual([
            '0x540daf363747246d40b31da95b3ef1c1497e22e9a56b70d117c835839822c95f'
        ])
    })
})
