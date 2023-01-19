# Service subscription Solidity smart contract

### Decentralized subscription service

### Structure:

1. `contracts/SubscriptionService.sol` - main contract
2. `contracts/SubscriptionServiceProxy.sol` - `TransparentUpgradeableProxy` contract
3. `Registration.sol` - contract for registrating addresses which are allowed to subscribe in `SubscriptionService`
4. `contracts/RegistrationProxy.sol` - `TransparentUpgradeableProxy` contract
5. `contracts/SubscriptionToken.sol` - `ERC20` token
6. `test/Subscription.ts` - tests

### Base functionality:

1. Allows user to subscribe for a service.
2. Allows user to cancel subscription.
3. The service can validate that user has active subscription.
4. SubscriptionService contract owner can publish new subscription variants
5. SubscriptionService contract owner can deactivate existing subscription variants

### Deployment:

Run `ts-node scripts/deploy.ts`

It will deploy `SubscriptionToken` and `Registration` contracts at first. And then `SubscriptionService` contract will be deployed with `SubscriptionToken` and `Registration` addresses passed

### Output:

```
Owner address is 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Token supply is 100000000
SubscriptionToken deployed to 0x5FbDB2315678afecb367f032d93F642f64180aa3
Registration deployed to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
SubscriptionService deployed to 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
SubscriptionServiceProxy deployed to 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
RegistrationProxy deployed to 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

### Tests:

Run `npx hardhat test`

### Output:

```
SubscriptionService
    Registration
      register
        ✔ Should register new addresses (1069ms)
        ✔ Should emit Registered event
        ✔ Should revert if address is already registered
      updateMetadata
        ✔ Should update metadata
        ✔ Should emit MetadataUrlChanged event
        ✔ Should revert if address is not registered
    SubscriptionService
      addNewSubscriptionVariant
        ✔ Should add new subscription variant accessible by its id
        ✔ Should emit SubscriptionVariantIssued event
      changeSubscriptionVariantAvailability
        ✔ makeSubscriptionVariantAvailable should set subscriptionVariant.available to true
        ✔ makeSubscriptionVariantUnavailable should set subscriptionVariant.available to false
      getSubscriptionVariantById
        ✔ Should fail if wrong id passed
        ✔ Should return correct variant (48ms)
      subscribe
        ✔ Address should have active subscription after this method
        ✔ Subscribed event should be emitted after successful subscription
        ✔ Should fail if subscription with id does not exist
        ✔ Should fail if already have an active subscription
        ✔ Should fail if address has insufficient amount of tokens
        ✔ Should cost valid amount of tokens
      unsubscribe
        ✔ Should remove active subscription
        ✔ Should revert if address is not a subscriber
        ✔ Should emit Unsubscribed event
```

