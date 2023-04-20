import { ethers } from "hardhat";

async function main() {
  const KeyPurchaser = await ethers.getContractFactory("KeyPurchaser");
  const keyPurchaser = await KeyPurchaser.deploy();

  await keyPurchaser.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
