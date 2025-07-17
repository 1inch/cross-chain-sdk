import {uint256BorchSerialized} from './uint256-borsh-serialized'

describe('uint256BorchSerialized', () => {
    it('should correctly serialize a uint256 value', () => {
        const serialized =
            uint256BorchSerialized(
                0xff00000000000000aa00000000000000cc00000000000000bb00000000000000n
            )
        expect(serialized).toEqual(
            Buffer.from(
                '00000000000000bb00000000000000cc00000000000000aa00000000000000ff',
                'hex'
            )
        )
    })
})
