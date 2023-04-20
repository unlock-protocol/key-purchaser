import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network, unlock } from "hardhat";

const expirationDuration = 24 * 60 * 60; // 1 day
const maxNumberOfKeys = 100; // 1 day
const keyPrice = ethers.utils.parseUnits("0.001");

const setupLock = async (params: any) => {
  await unlock.deployProtocol();
  const { lock } = await unlock.createLock(params);
  return lock;
};

const setupKeyPurchaser = async () => {
  const KeyPurchaser = await ethers.getContractFactory("KeyPurchaser");
  return KeyPurchaser.deploy();
};

describe("KeyPurchaser", function () {
  let user: any;
  let keyPurchaser: any;

  before(async function () {
    await unlock.deployProtocol();
    keyPurchaser = await setupKeyPurchaser();
  });

  describe("Base currency lock", function () {
    let lock: any;
    before(async function name() {
      user = (await ethers.getSigners())[0];
      lock = await setupLock({
        currencyContractAddress: ethers.constants.AddressZero,
        expirationDuration,
        maxNumberOfKeys,
        keyPrice,
        name: "Base currency lock",
      });
    });

    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        expect(await keyPurchaser.owner()).to.equal(user.address);
      });
      it("let us purchase a membership for a random recipient on the lock directly", async () => {
        const randomAddress = ethers.Wallet.createRandom().address;
        const tx = await lock.purchase(
          [keyPrice],
          [randomAddress],
          [randomAddress],
          [randomAddress],
          [0],
          { value: keyPrice }
        );
        await tx.wait();
        expect(await lock.getHasValidKey(randomAddress)).to.be.true;
      });
    });

    describe("purchase", function () {
      it("let us purchase a membership for a random recipient through the purchaser contract", async () => {
        const randomAddress = ethers.Wallet.createRandom().address;
        const tx = await keyPurchaser.purchaseSingleKey(
          lock.address,
          keyPrice,
          randomAddress,
          randomAddress,
          randomAddress,
          0,
          { value: keyPrice }
        );
        await tx.wait();
        expect(await lock.getHasValidKey(randomAddress)).to.be.true;
      });

      it("let us purchase a second membership for a random recipient through the purchaser contract", async () => {
        const randomAddress = ethers.Wallet.createRandom().address;
        const tx1 = await keyPurchaser.purchaseSingleKey(
          lock.address,
          keyPrice,
          randomAddress,
          randomAddress,
          randomAddress,
          0,
          { value: keyPrice }
        );
        await tx1.wait();
        const tokenId = await lock.tokenOfOwnerByIndex(randomAddress, 0);
        const expiration = await lock.keyExpirationTimestampFor(tokenId);
        expect(expiration * 1000).to.be.gt(new Date().getTime());

        // Let's now expire the ley (a lock manager can do that)
        const tx2 = await lock.expireAndRefundFor(tokenId, 0 /** no refund */);
        await tx2.wait();
        const expiration2 = await lock.keyExpirationTimestampFor(tokenId);
        expect(expiration).to.be.gt(expiration2);

        // Buy again to extend
        const tx3 = await keyPurchaser.purchaseSingleKey(
          lock.address,
          keyPrice,
          randomAddress,
          randomAddress,
          randomAddress,
          0,
          { value: keyPrice }
        );
        await tx3.wait();
        const expiration3 = await lock.keyExpirationTimestampFor(tokenId);
        expect(expiration3).to.be.gt(expiration);
      });
    });
  });
});
