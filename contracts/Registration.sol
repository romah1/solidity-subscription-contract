// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Registration {
  event Registered(address addr, string metadataUrl);
  event MetadataUrlChanged(address addr, string oldMetadataUrl, string newMetadataUrl);

  struct User {
    string metadataUrl;
    bool notEmpty;
  }

  mapping(address => User) public users;

  function register(string calldata metadataUrl_) public {
    require(!isAddressRegistered(msg.sender), "Already registered");
    users[msg.sender] = User(metadataUrl_, true);
    emit Registered(msg.sender, metadataUrl_);
  }

  function updateMetadata(string calldata newMetadataUrl_) public {
    require(isAddressRegistered(msg.sender), "Not registered");
    emit MetadataUrlChanged(msg.sender, users[msg.sender].metadataUrl, newMetadataUrl_);
    users[msg.sender].metadataUrl = newMetadataUrl_;
  }

  function isAddressRegistered(address addr_) public view returns (bool) {
    return users[addr_].notEmpty;
  }
}
