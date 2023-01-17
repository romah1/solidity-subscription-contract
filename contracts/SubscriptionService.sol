// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./Registration.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SubscriptionService {
  struct Subscription {
    uint variantId;
    uint startTime;
  }

  struct SubscriptionVariant {
    uint cost;
    uint timeToLive;
    bool available;
    uint id;
  }

  event SubscriptionVariantIssued(uint id);

  event SubscriptionVariantUnavailable(uint id);

  event Subscribed(address addr, uint variantId, uint startTime);

  event Unsubscribed(address addr, uint variantId, uint startTime);

  address public token;
  address public registration;

  mapping(address => Subscription) public addressSubscription;
  SubscriptionVariant[] public subscriptionVariants;

  address private _owner;

  constructor(address token_, address registration_) {
    token = token_;
    registration = registration_;
    _owner = msg.sender;
  }

  function subscribe(uint subscriptionVariantId_) public payable registeredOnly {
    subscriptionVariants.length;
    require(!hasActiveSubscription(), "Already have an active subscription");

    SubscriptionVariant memory subscriptionVariant = subscriptionVariantById(subscriptionVariantId_);
    bool ok = IERC20(token).transferFrom(msg.sender, address(this), subscriptionVariant.cost);
    require(ok, "Failed to transfer payment token");

    addressSubscription[msg.sender] = Subscription(subscriptionVariantId_, block.timestamp);

    emit Subscribed(msg.sender, subscriptionVariantId_, block.timestamp);
  }

  function unsubscribe() public registeredOnly {
    Subscription memory senderSubscription = addressSubscription[msg.sender];
    require(senderSubscription.startTime != 0, "Not a subscriber");
    delete addressSubscription[msg.sender];
    emit Unsubscribed(msg.sender, senderSubscription.variantId, senderSubscription.startTime); 
  }

  function hasActiveSubscription() public view registeredOnly returns (bool) {
    Subscription memory senderSubscription = addressSubscription[msg.sender];
    if (senderSubscription.startTime == 0) {
      return false;
    }
    SubscriptionVariant memory subscriptionVariant = subscriptionVariantById(senderSubscription.variantId);
    return block.timestamp - senderSubscription.startTime <= subscriptionVariant.timeToLive;
  }
  
  function addNewSubscriptionVariant(uint cost_, uint timeToLive_, bool availability_) public ownerOnly returns (uint) {
    uint newVariantId = subscriptionVariants.length;
    SubscriptionVariant memory subscriptionVariant = SubscriptionVariant(
      cost_,
      timeToLive_,
      availability_,
      newVariantId
    );
    subscriptionVariants.push(subscriptionVariant);
    emit SubscriptionVariantIssued(newVariantId);
    return newVariantId;
  }

  function makeSubscriptionVariantUnavailable(uint subscriptionVariantId_) public ownerOnly {
    changeSubscriptionVariantAvailility(subscriptionVariantId_, false);
  }

  function makeSubscriptionVariantAvailable(uint subscriptionVariantId_) public ownerOnly {
    changeSubscriptionVariantAvailility(subscriptionVariantId_, true);
  }

  function changeSubscriptionVariantAvailility(uint subscriptionVariantId_, bool newValue_) private ownerOnly {
    ensureSubscriptionVariantExists(subscriptionVariantId_);
    SubscriptionVariant storage subscriptionVariant = subscriptionVariants[subscriptionVariantId_];
    require(subscriptionVariant.available == !newValue_, "Subscription variant availability already equals newValue");
    subscriptionVariant.available = newValue_;
    emit SubscriptionVariantUnavailable(subscriptionVariantId_);
  }

  function subscriptionVariantById(uint id) public view returns (SubscriptionVariant memory) {
    ensureSubscriptionVariantExists(id);
    return subscriptionVariants[id];
  }

  function ensureSubscriptionVariantExists(uint id) public view {
    require(hasSubscriptionVariantWithId(id), "Subsciption variant does not exists");
  }

  function hasSubscriptionVariantWithId(uint id) public view returns (bool) {
    return id < subscriptionVariants.length;
  }

  modifier ownerOnly() {
    require(_owner == msg.sender, "Ownership Assertion: Caller of the function is not the owner.");
    _;
  }

  modifier registeredOnly() {
    require(
      Registration(registration).isAddressRegistered(msg.sender),
      "Registration Assertion: Caller of the function is not registered."
    );
    _;
  }
}
