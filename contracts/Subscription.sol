// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Subscription {
  uint public subscriptionStartTime;
  uint public subsctiptiosStopTime;
  uint public payPeriodTime;
  uint public periodCost;
  address payable owner;

  event Subscribe(
    address subscriber,
    uint cost,
    uint subsctiptionActivateTime,
    uint subscriptionStopTime
  );
  event Unsubscribe(address subscriber, uint stopTime, uint refundAmount);

  constructor(
    uint subscriptionStartTime,
    uint subsctiptionStopTime,
    uint payPeriodTime,
    uint periodCost
  ) payable {}
}