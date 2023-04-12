describe("Art Data", () => {
  let tokenId;

  beforeEach(async () => {
    await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
    tokenId = (await artGallery.totalSupply()).toNumber();
  });

  it("Should retrieve correct art data", async () => {
    const art = await artGallery.getArt(tokenId);
    expect(art.title).to.equal("Title");
    expect(art.description).to.equal("Description");
    expect(art.price.toNumber()).to.equal(100);
    expect(art.artist).to.equal(artist);
  });

  it("Should retrieve correct owner of the art", async () => {
    const artOwner = await artGallery.ownerOf(tokenId);
    expect(artOwner).to.equal(artist);
  });

  it("Should update art data", async () => {
    await artGallery.updateArt(tokenId, "New Title", "New Description", 200, { from: artist });
    const updatedArt = await artGallery.getArt(tokenId);
    expect(updatedArt.title).to.equal("New Title");
    expect(updatedArt.description).to.equal("New Description");
    expect(updatedArt.price.toNumber()).to.equal(200);
  });

  it("Non-owner artist cannot update art data", async () => {
    try {
      await artGallery.updateArt(tokenId, "New Title", "New Description", 200, { from: nonOwner });
      assert.fail("Non-owner artist should not be able to update art data");
    } catch (err) {
      expect(err.reason).to.equal("Caller is not the artist");
    }
  });
});

describe("Token URI", () => {
  let tokenId;

  beforeEach(async () => {
    await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
    tokenId = (await artGallery.totalSupply()).toNumber();
  });

  it("Should set token URI correctly", async () => {
    const tokenURI = "https://example.com/metadata/1";
    await artGallery.setTokenURI(tokenId, tokenURI, { from: artist });
    const retrievedTokenURI = await artGallery.tokenURI(tokenId);
    expect(retrievedTokenURI).to.equal(tokenURI);
  });

  it("Non-owner artist cannot set token URI", async () => {
    try {
      const tokenURI = "https://example.com/metadata/1";
      await artGallery.setTokenURI(tokenId, tokenURI, { from: nonOwner });
      assert.fail("Non-owner artist should not be able to set token URI");
    } catch (err) {
      expect(err.reason).to.equal("Caller is not the artist");
    }
  });
});

describe("Art Ownership", () => {
  let tokenId;

  beforeEach(async () => {
    await artGallery.mintArt("Title", "Description", 100, artist, { from: owner });
    tokenId = (await artGallery.totalSupply()).toNumber();
  });

  it("Should transfer art ownership", async () => {
    await artGallery.transferFrom(artist, buyer, tokenId, { from: artist });
    const newOwner = await artGallery.ownerOf(tokenId);
    expect(newOwner).to.equal(buyer);
  });

  it("Non-owner cannot transfer art ownership", async () => {
    try {
      await artGallery.transferFrom(artist, buyer, tokenId, { from:
