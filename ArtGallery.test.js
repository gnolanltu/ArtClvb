const ArtGallery = artifacts.require("ArtGallery");
const { expect } = require("chai");

contract("ArtGallery", ([owner, buyer, artist, nonOwner]) => {
  let artGallery;

  beforeEach(async () => {
    artGallery = await ArtGallery.new();
  });

  describe("Minting Art", () => {
    it("Should mint art and emit an event", async () => {
      const tx = await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
      const tokenId = (await artGallery.totalSupply()).toNumber();
      expect(tokenId).to.equal(1);
      expect(tx.logs[0].event).to.equal("ArtMinted");
    });

    it("Non-owner cannot mint art", async () => {
      try {
        await artGallery.mintArt("Title", "Description", 100, artist, { from: nonOwner });
        assert.fail("Non-owner should not be able to mint art");
      } catch (err) {
        expect(err.reason).to.equal("Ownable: caller is not the owner");
      }
    });
  });

  describe("Purchasing Art", () => {
    beforeEach(async () => {
      await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
    });

    it("Should allow purchasing and emit an event", async () => {
      const price = web3.utils.toWei("100", "ether");
      const tx = await artGallery.purchaseArt(1, { from: buyer, value: price });
      expect(tx.logs[0].event).to.equal("ArtPurchased");
    });

    it("Cannot purchase art with insufficient funds", async () => {
      const price = web3.utils.toWei("99", "ether");
      try {
        await artGallery.purchaseArt(1, { from: buyer, value: price });
        assert.fail("Should not be able to purchase with insufficient funds");
      } catch (err) {
        expect(err.reason).to.equal("Insufficient funds");
      }
    });
  });

  describe("Withdrawing Funds", () => {
    beforeEach(async () => {
      await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
      const price = web3.utils.toWei("100", "ether");
      await artGallery.purchaseArt(1, { from: buyer, value: price });
    });

    it("Should allow owner to withdraw funds", async () => {
      const initialBalance = await web3.eth.getBalance(owner);
      await artGallery.withdrawFunds({ from: owner });
      const newBalance = await web3.eth.getBalance(owner);
      expect(parseFloat(newBalance)).to.be.above(parseFloat(initialBalance));
    });

    it("Non-owner cannot withdraw funds", async () => {
      try {
        await artGallery.withdrawFunds({ from: nonOwner });
        assert.fail("Non-owner should not be able to withdraw funds");
      } catch (err) {
        expect(err.reason).to.equal("Ownable: caller is not the owner");
      }
    });
  });
});
