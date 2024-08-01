import {HashLock} from './hash-lock'

describe('HashLock', () => {
    it('should create single fill HashLock', () => {
        expect(
            HashLock.forSingleFill(
                'S\x1D\x1D-zYO\x1C~A;\x07L{i1aHk\\I]EwH\x14J\x01y\\jE'
            ).toString()
        ).toEqual(
            '0x9f65fdcf781d4320c2dde70da02a1fe916d595dc1817149cc4758fd6a4bfd830'
        )
    })

    it('should create multiple fill HashLock', () => {
        const secrets = [
            'S\x1D\x1D-zYO\x1C~A;\x07L{i1aHk\\I]EwH\x14J\x01y\\jE',
            'ex\x12\x13kP\x00e\x1D^\x18QmvK^f\x1Ah\x1Cv\r<<L\x15u\x10 ux#',
            "b\x07\x1A2#Q(\x1F\x04uev'\f6*n[9^;\x0Fh\x02\x7F#\x11AU\\=C"
        ]

        const leaves = HashLock.getMerkleLeaves(secrets)
        expect(HashLock.forMultipleFills(leaves).toString()).toEqual(
            '0x160a450ad51097012ff74f91e1ff6fb3f5bd8e8e2cd6a91a513f03bcb89a76f7'
        )
    })
})