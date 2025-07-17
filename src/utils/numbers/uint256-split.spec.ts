import {uint256split} from './uint256-split'

describe('uint256split', () => {
    it('should convert u256 to four u64 bigint', () => {
        const res =
            uint256split(
                0xff00000000000000aa00000000000000cc00000000000000bb00000000000000n
            )

        expect(res).toEqual([
            0xbb00000000000000n,
            0xcc00000000000000n,
            0xaa00000000000000n,
            0xff00000000000000n
        ])
    })
})
