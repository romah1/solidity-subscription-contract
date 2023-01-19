import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SubscriptionService", function () {
  async function deploySubscriptionFixture() {
    const tokenSupply = 1e15;

    const [owner, otherAccount] = await ethers.getSigners();


    const SubscriptionToken = await ethers.getContractFactory("SubscriptionToken");
    const subscriptionToken = await SubscriptionToken.deploy(tokenSupply);

    const Registration = await ethers.getContractFactory("Registration");
    const registration = await Registration.deploy();
    await registration.register("")

    const SubscriptionService = await ethers.getContractFactory("SubscriptionService");
    const subscriptionService = await SubscriptionService.deploy(subscriptionToken.address, registration.address);

    const SubscriptionServiceProxy = await ethers.getContractFactory("SubscriptionServiceProxy");
    const subscriptionServiceProxy = await SubscriptionServiceProxy.deploy(subscriptionService.address, owner.address, []);

    return {
      subscriptionService,
      subscriptionServiceProxy,
      subscriptionToken,
      registration,
      owner,
      otherAccount,
      tokenSupply
    };
  }

  describe("Registration", function (){
    describe("register", function() {
      it("Should register new addresses", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await registration.connect(otherAccount).register("");
        expect(await registration.isAddressRegistered(otherAccount.address)).to.equals(true);
      });

      it("Should emit Registered event", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        const meta = "url";
        await expect(registration.connect(otherAccount).register(meta))
          .to.emit(registration, "Registered")
          .withArgs(otherAccount.address, meta);
      });

      it("Should revert if address is already registered", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await registration.connect(otherAccount).register("");
        await expect(registration.connect(otherAccount).register("")).to.be.revertedWith("Already registered");
      });
    });

    describe("updateMetadata", function() {
      it("Should update metadata", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await registration.connect(otherAccount).register("old");
        await registration.connect(otherAccount).updateMetadata("new");
        expect((await registration.users(otherAccount.address)).metadataUrl).to.equals("new");
      });

      it("Should emit MetadataUrlChanged event", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await registration.connect(otherAccount).register("old");
        await expect(registration.connect(otherAccount).updateMetadata("new"))
          .to.emit(registration, "MetadataUrlChanged")
          .withArgs(otherAccount.address, "old", "new");
      });

      it("Should revert if address is not registered", async function() {
        const { registration, otherAccount } = await loadFixture(deploySubscriptionFixture);
        await expect(registration.connect(otherAccount).updateMetadata("new"))
          .to.be.revertedWith("Not registered");
      });
    });
  });

  describe("SubscriptionService", function () {
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
        expect(await subscriptionService.hasActiveSubscription()).to.equals(true);
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
        expect(await subscriptionService.hasActiveSubscription()).to.equals(true);

        await subscriptionService.unsubscribe();
        expect(await subscriptionService.hasActiveSubscription()).to.equals(false);
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
