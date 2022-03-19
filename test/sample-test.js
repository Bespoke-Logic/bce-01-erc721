const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("ChassisNFT", function () {
  let ChassisNFT, chassis;
  beforeEach(async () => {
    ChassisNFT = await ethers.getContractFactory("Chassis");
    chassis = await ChassisNFT.deploy();
    await chassis.deployed();
  });

  it("Should be an ERC721 token", async () => {
    expect(await chassis.name()).to.equal("Chassis");
    expect(await chassis.symbol()).to.equal("CHASSIS");
  });

  it("Should be pausable", async () => {
    const accounts = await hre.ethers.getSigners();
    const owner = accounts[0];
    const receiver = accounts[1];
    await chassis
      .connect(receiver)
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.balanceOf(receiver.address)).to.equal(1);
    await chassis.connect(owner).pause();
    expect(
      chassis.connect(receiver).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    expect(await chassis.balanceOf(receiver.address)).to.equal(1);
    await chassis.connect(owner).unpause();
    await chassis
      .connect(receiver)
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.balanceOf(receiver.address)).to.equal(2);
  });

  it("Should be pausable", async () => {
    const accounts = await hre.ethers.getSigners();
    const owner = accounts[0];
    const receiver = accounts[1];
    await chassis
      .connect(receiver)
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis.connect(owner).pause();
    expect(
      chassis.connect(receiver).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    await chassis.connect(owner).unpause();
    chassis.connect(receiver).mint({ value: ethers.utils.parseEther("1") });
  });

  it("Should enforce TOTAL SUPPLY limits", async () => {
    const accounts = await hre.ethers.getSigners();
    await chassis
      .connect(accounts[0])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[0])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.totalSupply()).to.equal(2);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("2"));
    await chassis
      .connect(accounts[1])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[1])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.totalSupply()).to.equal(4);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("4"));
    await chassis
      .connect(accounts[2])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[2])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.totalSupply()).to.equal(6);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("6"));
    await chassis
      .connect(accounts[3])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[3])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.totalSupply()).to.equal(8);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("8"));
    await chassis
      .connect(accounts[4])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[4])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.totalSupply()).to.equal(10);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("10"));
    await expect(
      chassis.connect(accounts[5]).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    await expect(
      chassis.connect(accounts[5]).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    expect(await chassis.totalSupply()).to.equal(10);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("10"));
  });

  it("Should enforce PER WALLET limits", async () => {
    const accounts = await hre.ethers.getSigners();
    await chassis
      .connect(accounts[2])
      .mint({ value: ethers.utils.parseEther("1") });
    await chassis
      .connect(accounts[2])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.balanceOf(accounts[2].address)).to.equal(2);
    expect(await chassis.totalSupply()).to.equal(2);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("2"));
    await expect(
      chassis.connect(accounts[2]).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    expect(await chassis.balanceOf(accounts[2].address)).to.equal(2);
    expect(await chassis.totalSupply()).to.equal(2);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("2"));
    await expect(
      chassis.connect(accounts[2]).mint({ value: ethers.utils.parseEther("1") })
    ).to.be.reverted;
    expect(await chassis.balanceOf(accounts[2].address)).to.equal(2);
    expect(await chassis.totalSupply()).to.equal(2);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("2"));
  });

  it("Should enforce MINT PRICE", async () => {
    const accounts = await hre.ethers.getSigners();
    await expect(chassis.connect(accounts[1]).mint()).to.be.reverted;
    expect(await chassis.balanceOf(accounts[1].address)).to.equal(0);
    await expect(chassis.connect(accounts[1]).mint({ value: 0.001 })).to.be
      .reverted;
    await expect(chassis.connect(accounts[1]).mint({ value: 0.01 })).to.be
      .reverted;
    expect(await chassis.balanceOf(accounts[1].address)).to.equal(0);
    expect(await chassis.getBalance()).to.equal(0);
    await expect(
      chassis
        .connect(accounts[1])
        .mint({ value: ethers.utils.parseEther("10") })
    ).to.be.reverted;
    expect(await chassis.balanceOf(accounts[1].address)).to.equal(0);
    expect(await chassis.getBalance()).to.equal(0);
    await chassis
      .connect(accounts[1])
      .mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.balanceOf(accounts[1].address)).to.equal(1);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("1"));
  });

  it("Should allow the owner to withdraw proceeds", async () => {
    const accounts = await hre.ethers.getSigners();
    const owner = accounts[0];
    const buyer = accounts[1];
    const provider = ethers.provider;
    expect(await chassis.getBalance()).to.equal(0);
    await chassis.connect(buyer).mint({ value: ethers.utils.parseEther("1") });
    expect(await chassis.balanceOf(accounts[1].address)).to.equal(1);
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("1"));
    // non owner can't withdraw
    await expect(
      chassis.connect(buyer).withdraw(ethers.utils.parseEther("0.5"))
    ).to.be.reverted;
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("1"));
    // Owner can't withdraw more than the balance
    await expect(chassis.connect(owner).withdraw(ethers.utils.parseEther("2")))
      .to.be.reverted;
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("1"));

    // Owner can withdraw less than the balance, and the balance will be updated
    // const initialBalance = await provider.getBalance(owner.address);
    await expect(() =>
      chassis.connect(owner).withdraw(ethers.utils.parseEther("0.1"))
    ).to.changeEtherBalance(owner, ethers.utils.parseEther("0.1"));
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("0.9"));
    // Owner can't withdraw more than the balance again
    await expect(chassis.connect(owner).withdraw(ethers.utils.parseEther("1")))
      .to.be.reverted;
    expect(await chassis.getBalance()).to.equal(ethers.utils.parseEther("0.9"));
  });
});
