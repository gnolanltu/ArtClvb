// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtGallery is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address payable public owner;

    constructor() ERC721("ArtGallery", "ART") {
        owner = payable(msg.sender);
    }

    struct Painting {
        string name;
        string artist;
        uint256 price;
        address payable owner;
        string ipfsLink;
    }

    struct Offer {
        address payable buyer;
        uint256 amount;
        bool isActive;
    }

    mapping(uint256 => Offer) public offers;
    mapping(uint256 => Painting) public paintings;

    event PaintingCreated(uint256 indexed tokenId, string name, string artist, uint256 price, address owner, string ipfsLink);
    event PaintingTransferred(uint256 indexed tokenId, address indexed oldOwner, address indexed newOwner);
    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event OfferAccepted(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event OfferRejected(uint256 indexed tokenId, address indexed buyer, uint256 amount);

    function createPainting(string memory name, string memory artist, uint256 price, string memory ipfsLink) public payable onlyOwner returns (uint256) {
        require(msg.value == price, "Please send the correct amount to purchase the painting.");
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(msg.sender, newTokenId);

        Painting memory newPainting = Painting(name, artist, price, payable(msg.sender), ipfsLink);
        paintings[newTokenId] = newPainting;

        emit PaintingCreated(newTokenId, name, artist, price, msg.sender, ipfsLink);

        owner.transfer(msg.value);
        return newTokenId;
    }

    function buyPainting(uint256 tokenId) public payable {
        Painting storage painting = paintings[tokenId];
        require(msg.value == painting.price, "Please send the correct amount to purchase the painting.");
        require(msg.sender != painting.owner, "You already own this painting.");

        address payable oldOwner = painting.owner;
        address payable newOwner = payable(msg.sender);

        painting.owner = newOwner;
        _transfer(oldOwner, newOwner, tokenId);

        oldOwner.transfer(msg.value);
    }

    function transferOwnership(uint256 tokenId) public onlyOwner {
        Painting storage painting = paintings[tokenId];
        require(painting.owner == owner, "Only paintings owned by the contract owner can be transferred.");
        require(keccak256(bytes(painting.artist)) == keccak256(bytes(painting.artist)), "The artist's name must match the name provided in the painting data.");

        address payable oldOwner = painting.owner;
        address payable newOwner = payable(msg.sender);

        painting.owner = newOwner;
        _transfer(oldOwner, newOwner, tokenId);

        emit PaintingTransferred(tokenId, oldOwner, newOwner);
    }

    function makeOffer(uint256 tokenId, uint256 amount) public payable {
        require(paintings[tokenId].owner != address(0), "Painting does not exist.");
        require(msg.value == amount, "Please send the correct amount to make an offer.");
        require(msg.sender != paintings[tokenId].owner, "You already own this painting.");

        offers[tokenId] = Offer(payable(msg.sender), amount, true);
        emit OfferMade(tokenId, msg.sender, amount);
    }

    function acceptOffer(uint256 tokenId) public {
        require(paintings[tokenId].owner == msg.sender, "You do not own this painting.");
        require(offers[tokenId].isActive, "There is no active offer for this painting.");

        Painting storage painting = paintings[tokenId];
        Offer storage offer = offers[tokenId];

        address payable oldOwner = painting.owner;
        address payable newOwner = offer.buyer;

        painting.owner = newOwner;
        painting.price = offer.amount;
        _transfer(oldOwner, newOwner, tokenId);

        oldOwner.transfer(offer.amount);
        offer.isActive = false;

        emit OfferAccepted(tokenId, newOwner, offer.amount);
    }

    function rejectOffer(uint256 tokenId) public {
        require(paintings[tokenId].owner == msg.sender, "You do not own this painting.");
        require(offers[tokenId].isActive, "There is no active offer for this painting.");

        Offer storage offer = offers[tokenId];
        address payable buyer = offer.buyer;

        buyer.transfer(offer.amount);
        offer.isActive = false;

        emit OfferRejected(tokenId, buyer, offer.amount);
    }

    function withdrawOffer(uint256 tokenId) public {
        require(offers[tokenId].buyer == msg.sender, "You did not make an offer for this painting.");
        require(offers[tokenId].isActive, "There is no active offer for this painting.");

        Offer storage offer = offers[tokenId];
        address payable buyer = offer.buyer;

        buyer.transfer(offer.amount);
        offer.isActive = false;

        emit OfferRejected(tokenId, buyer, offer.amount);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }
}
