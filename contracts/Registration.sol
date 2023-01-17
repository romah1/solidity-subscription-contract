// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Registration {
  struct User {
    uint registrationTime;
    string metadataUrl;
  }

  mapping(address => User) public users;

  constructor() {
  }

  function register(string calldata metadataUrl_) public {
    require(!isAddressRegistered(msg.sender), "Already registered");
    users[msg.sender] = User(block.timestamp, metadataUrl_);
  }

  function updateMetadata(string calldata newMetadataUrl_) public {
    require(!isAddressRegistered(msg.sender), "Not registered yet");
    users[msg.sender].metadataUrl = newMetadataUrl_;
  }

  function isAddressRegistered(address addr_) public view returns (bool) {
    return users[addr_].registrationTime != 0;
  }
}
