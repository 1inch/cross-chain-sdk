pragma solidity ^0.8.23;

import {EscrowFactory, IERC20} from '../lib/cross-chain-swap/contracts/EscrowFactory.sol';

contract TestSettlement is EscrowFactory {
    // solhint-disable-next-line no-empty-blocks
    constructor(
        address limitOrderProtocol,
        IERC20 feeToken,
        IERC20 accessToken,
        address owner,
        uint32 rescueDelaySrc,
        uint32 rescueDelayDst
    )
        EscrowFactory(
            limitOrderProtocol,
            feeToken,
            accessToken,
            owner,
            rescueDelaySrc,
            rescueDelayDst
        )
    {}
}
