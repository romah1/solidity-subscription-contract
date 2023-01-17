// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SubscriptionService {
  struct Subscription {
    bytes32 variantId;
    uint startTime;
  }

  struct SubscriptionVariant {
    uint cost;
    uint timeToLive;
    bool available;
  }

  event SubscriptionVariantIssued(bytes32 id);

  event SubscriptionVariantUnavailable(bytes32 id);

  event Subscribed(address addr, bytes32 variantId, uint startTime);

  event Unsubscribed(address addr, bytes32 variantId, uint startTime);

  address public token;
  mapping(address => Subscription) public addressSubscription;
  mapping(bytes32 => SubscriptionVariant) public subscriptionVariantById;
  SubscriptionVariant[] public allSubscriptionVariants;

  address private _owner;

  constructor(address token_) {
    token = token_;
    _owner = msg.sender;
  }

  function subscribe(bytes32 subscriptionVariantId_) public payable {
    require(!isSubscriptionAlive(), "Already have an active subscription");

    SubscriptionVariant memory subscriptionVariant = subscriptionVariantById[subscriptionVariantId_];
    require(subscriptionVariant.available == true, "Subscription variant is unavailable");
    
    bool ok = IERC20(token).transfer(address(this), subscriptionVariant.cost);
    require(ok, "Failed to transfer payment token");

    addressSubscription[msg.sender] = Subscription(subscriptionVariantId_, block.timestamp);
  }

  function unsubscribe() public {
    Subscription memory senderSubscription = addressSubscription[msg.sender];
    require(senderSubscription.startTime != 0, "Not a subscriber");
    delete addressSubscription[msg.sender];
    emit Unsubscribed(msg.sender, senderSubscription.variantId, senderSubscription.startTime); 
  }

  function isSubscriptionAlive() public view returns (bool) {
    Subscription memory senderSubscription = addressSubscription[msg.sender];
    if (senderSubscription.startTime == 0) {
      return false;
    }
    SubscriptionVariant memory subscriptionVariant = subscriptionVariantById[senderSubscription.variantId];
    return block.timestamp - senderSubscription.startTime <= subscriptionVariant.timeToLive;
  }
  
  function addNewSubscriptionVariant(SubscriptionVariant calldata subscriptionVariant_) private ownerOnly {
    require(subscriptionVariant_.timeToLive != 0, "Subscriptions with zero timeToLive are not allowed");
    bytes32 newSubscriptionVariantId = subscriptionVariantId(subscriptionVariant_);
    require(subscriptionVariantById[newSubscriptionVariantId].timeToLive == 0, "Subscription already exists");
    subscriptionVariantById[newSubscriptionVariantId] = subscriptionVariant_;
    allSubscriptionVariants.push(subscriptionVariant_);
    emit SubscriptionVariantIssued(newSubscriptionVariantId);
  }

  function makeSubscriptionVariantUnavailable(bytes32 subscriptionVariantId_) private ownerOnly {
    SubscriptionVariant storage subscriptionVariant = subscriptionVariantById[subscriptionVariantId_];
    require(subscriptionVariant.timeToLive != 0, "Subscription does not exist");
    require(subscriptionVariant.available == true, "Subscription is already unavailable");
    subscriptionVariant.available = false;
    emit SubscriptionVariantUnavailable(subscriptionVariantId_);
  }

  function subscriptionVariantId(SubscriptionVariant calldata subscriptionVariant_) public pure returns (bytes32) {
    return keccak256(abi.encode(subscriptionVariant_));
  } 

  modifier ownerOnly() {
    require(_owner == msg.sender, "Ownership Assertion: Caller of the function is not the owner.");
    _;
  }
}
