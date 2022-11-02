import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  async function deploySubscriptionFixture() {
    const subscriptionStartTime = Math.round(Date.now() / 1000);
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const subscriptionStopTime = subscriptionStartTime + ONE_YEAR_IN_SECS;
    const period_in_secs = 28 * 24 * 60 * 60;
    const period_cost = ethers.utils.parseEther("1");

    const [owner, otherAccount] = await ethers.getSigners();

    const Subscription = await ethers.getContractFactory("Subscription");
    const subscription = await Subscription.deploy(
      subscriptionStartTime,
      subscriptionStopTime,
      period_in_secs,
      period_cost
    )

    return {
      subscription,
      subscriptionStartTime,
      subscriptionStopTime,
      period_in_secs,
      period_cost,
      owner,
      otherAccount
    };
  }

  describe("Deployment", function () {
    it("Should set the right subscriptionStartTime", async function () {
      const { subscription, subscriptionStartTime } = await loadFixture(deploySubscriptionFixture);

      expect(await subscription.subscriptionStartTime()).to.equal(subscriptionStartTime);
    });
  });

  describe("Subscribe", function () {
    describe("Validations", function () {
      it("Should fail if user payed not enough tokens", async function () {
      });

      it("Should fail if user has already active subscription", async function () {
      });
    });

    describe("Events", function () {
      it("Should emit an event on subscribe", async function () {
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
      });
    });
  });

  describe("Unsubscribe", function () {
    describe("Validations", function () {
      it("Should fail if user does not have active subscription", async function () {
      });
    });

    describe("Events", function () {
      it("Should emit an event on unsubscribe", async function () {
      });
    });

    describe("Transfers", function () {
      it("Should return part of tokens back if user's subscriptions will last more than 1 period", async function () {
      });
    });
  });
});
