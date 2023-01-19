import { ethers } from "hardhat";

async function main() {
  const TokenSupply = 1e8
  const [owner] = await ethers.getSigners();

  const SubscriptionToken = await ethers.getContractFactory("SubscriptionToken");
  const subscriptionToken = await SubscriptionToken.deploy(TokenSupply);

  const Registration = await ethers.getContractFactory("Registration");
  const registration = await Registration.deploy();

  const SubscriptionService = await ethers.getContractFactory("SubscriptionService");
  const subscriptionService = await SubscriptionService.deploy(subscriptionToken.address, registration.address);

  const SubscriptionServiceProxy = await ethers.getContractFactory("SubscriptionServiceProxy");
  const subscriptionServiceProxy = await SubscriptionServiceProxy.deploy(subscriptionService.address, owner.address, []);

  const RegistrationProxy = await ethers.getContractFactory("RegistrationProxy");
  const registrationProxy = await RegistrationProxy.deploy(registration.address, owner.address, []);

  console.log(
    `Owner address is ${owner.address}
Token supply is ${TokenSupply}
SubscriptionToken deployed to ${subscriptionToken.address}
Registration deployed to ${registration.address}
SubscriptionService deployed to ${subscriptionService.address}
SubscriptionServiceProxy deployed to ${subscriptionServiceProxy.address}
RegistrationProxy deployed to ${registrationProxy.address}`
  )
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
