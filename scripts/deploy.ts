import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const subscriptionStopTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const Subscription = await ethers.getContractFactory("Subscription");

  const period_in_secs = 28 * 24 * 60 * 60;
  const period_cost = ethers.utils.parseEther("1");

  const subscription = await Subscription.deploy(
    currentTimestampInSeconds,
    subscriptionStopTime,
    period_in_secs,
    period_cost
  )
  await subscription.deployed()

  console.log(
    `Subscription with
    ${currentTimestampInSeconds} start time,
    ${subscriptionStopTime} stop time,
    ${period_in_secs} period in secs,
    ${period_cost} period cost
    deployed to ${subscription.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
