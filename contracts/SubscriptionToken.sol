// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SubscriptionToken is ERC20 {
  constructor(uint256 _supply) ERC20("SubscriptionToken", "STK") {
    _mint(msg.sender, _supply);
  }
}
