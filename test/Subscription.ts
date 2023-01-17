import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  async function deploySubscriptionFixture() {
    const subscriptionStartTime = Math.round(Date.now() / 1000);
    const tokenSupply = 1e15;
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const subscriptionStopTime = subscriptionStartTime + ONE_YEAR_IN_SECS;
    const period_in_secs = 28 * 24 * 60 * 60;
    const period_cost = ethers.utils.parseEther("1");

    const [owner, otherAccount] = await ethers.getSigners();


    const SubscriptionToken = await ethers.getContractFactory("SubscriptionToken");
    const subscriptionToken = await SubscriptionToken.deploy(tokenSupply);

    const SubscriptionService = await ethers.getContractFactory("SubscriptionService");
    const subscriptionService = await SubscriptionService.deploy(subscriptionToken.address);

    const SubscriptionServiceProxy = await ethers.getContractFactory("SubscriptionServiceProxy");
    const subscriptionServiceProxy = await SubscriptionServiceProxy.deploy(subscriptionService.address, owner.address, []);

    return {
      subscriptionService,
      subscriptionServiceProxy,
      subscriptionToken,
      owner,
      otherAccount,
      tokenSupply
    };
  }

  describe("Deployment", function () {
    it("Should set the right subscriptionStartTime", async function () {
      // const { subscription, subscriptionStartTime } = await loadFixture(deploySubscriptionFixture);

      // expect(await subscription.subscriptionStartTime()).to.equal(subscriptionStartTime);
    });
  });

  describe("SubscriptionVariants", function () {
    describe("addNewSubscriptionVariant", function () {
      it("Should add new subscription variant accessible by its id", async function () {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        const cost = 1;
        const ttl = 1e8;
        const available = true;

        await subscriptionService.addNewSubscriptionVariant(cost, ttl, available);

        const subscriptionVariant = await subscriptionService.subscriptionVariantById(0);

        expect(subscriptionVariant.cost).to.equals(cost);
        expect(subscriptionVariant.timeToLive).to.equals(ttl);
        expect(subscriptionVariant.available).to.equals(available);
        expect(subscriptionVariant.id).to.equals(0);
      });

      it("Should emit SubscriptionVariantIssued event", async function () {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);

        await expect(subscriptionService.addNewSubscriptionVariant(1, 1, true,))
          .to.emit(subscriptionService, "SubscriptionVariantIssued")
          .withArgs(0);
      });
    });

    describe("changeSubscriptionVariantAvailability", async function () {
      it("makeSubscriptionVariantAvailable should set subscriptionVariant.available to true", async function () {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(1, 1, false)
        const subscriptionVariant = await subscriptionService.subscriptionVariantById(0);
        expect(subscriptionVariant.available).to.equals(false);
        await subscriptionService.makeSubscriptionVariantAvailable(subscriptionVariant.id);
        const newSubscriptionVariant = await subscriptionService.subscriptionVariantById(0);
        expect(newSubscriptionVariant.available).to.equals(true);
      });

      it("makeSubscriptionVariantUnavailable should set subscriptionVariant.available to false", async function () {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(1, 1, true)
        const subscriptionVariant = await subscriptionService.subscriptionVariantById(0);
        expect(subscriptionVariant.available).to.equals(true);
        await subscriptionService.makeSubscriptionVariantUnavailable(subscriptionVariant.id);
        const newSubscriptionVariant = await subscriptionService.subscriptionVariantById(0);
        expect(newSubscriptionVariant.available).to.equals(false);
      });
    });

    describe("getSubscriptionVariantById", function() {
      it("Should fail if wrong id passed", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await expect(subscriptionService.subscriptionVariantById(0)).to.be.revertedWith("Subsciption variant does not exists");
      });

      it("Should return correct variant", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        for (let i = 0; i < 5; ++i) {
          await subscriptionService.addNewSubscriptionVariant(2 * i, 1, true);
        }
        
        for (let i = 0; i < 5; ++i) {
          const variant = await subscriptionService.subscriptionVariantById(i);
          expect(variant.id).to.equals(i);
          expect(variant.cost).to.equals(2 * i);
        }
      });
    });

    describe("subscribe", function() {
      it("Address should have active subscription after this method", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(0, 1e8, true);
        await subscriptionService.subscribe(0);
        expect(await subscriptionService.isSubscriptionAlive()).to.equals(true);
      });

      it("Subscribed event should be emitted after successful subscription", async function() {
        const { subscriptionService, owner } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(0, 1e8, true);
        await expect(subscriptionService.subscribe(0))
          .to.emit(subscriptionService, "Subscribed")
          .withArgs(owner.address, 0, anyValue);
      });

      it("Should fail if subscription with id does not exist", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await expect(subscriptionService.subscribe(0))
          .to.be.revertedWith("Subsciption variant does not exists");
      });

      it("Should fail if already have an active subscription", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(0, 1e8, true);
        await subscriptionService.subscribe(0);
        await expect(subscriptionService.subscribe(0)).to.be.revertedWith("Already have an active subscription");
      });

      it("Should fail if address has insufficient amount of tokens", async function() {
        const { subscriptionService, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(100, 1e8, true);
        await expect(subscriptionService.connect(otherAccount).subscribe(0)).to.be.reverted;
      });

      it("Should cost valid amount of tokens", async function () {
        const { subscriptionService, subscriptionToken, owner } = await loadFixture(deploySubscriptionFixture);
        const cost = 100;
        await subscriptionService.addNewSubscriptionVariant(cost, 1e8, true);
        const balance = await subscriptionToken.balanceOf(owner.address);
        await subscriptionToken.approve(subscriptionService.address, cost);
        await subscriptionService.subscribe(0)
        const newBalance = await subscriptionToken.balanceOf(owner.address);
        expect(balance.sub(newBalance)).to.equals(cost);
      });
    });

    describe("unsubscribe", async function() {
      it("Should remove active subscription", async function() {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(0, 1e8, true);
        await subscriptionService.subscribe(0);
        expect(await subscriptionService.isSubscriptionAlive()).to.equals(true);

        await subscriptionService.unsubscribe();
        expect(await subscriptionService.isSubscriptionAlive()).to.equals(false);
      });

      it("Should revert if address is not a subscriber", async function () {
        const { subscriptionService } = await loadFixture(deploySubscriptionFixture);
        await expect(subscriptionService.unsubscribe()).to.be.revertedWith("Not a subscriber");
      });

      it("Should emit Unsubscribed event", async function() {
        const { subscriptionService, owner } = await loadFixture(deploySubscriptionFixture);
        await subscriptionService.addNewSubscriptionVariant(0, 1e8, true);
        await subscriptionService.subscribe(0);

        await expect(subscriptionService.unsubscribe())
          .to.emit(subscriptionService, "Unsubscribed")
          .withArgs(owner.address, 0, anyValue);
      });
    });
  });
});
