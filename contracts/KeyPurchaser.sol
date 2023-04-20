// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV12.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract KeyPurchaser is Ownable {
    /**
     * Sets the owner!
     */
    constructor() Ownable() {}

    /**
     * This function will purchase a single key for a lock, or extend if a key already exists for this user on the lock!
     * @param lockAddress address of the lock contract
     * @param value value of the purchase (security measure to prevent front-running)
     * @param recipient address of the NFT holder for the NFT to be minted
     * @param referrer address of the referrer (will receive UDT tokens)
     * @param data blob of data that might be used by a a lock's hook
     */
    function purchaseSingleKey(
        address lockAddress,
        uint value,
        address recipient,
        address manager,
        address referrer,
        bytes calldata data
    ) public payable onlyOwner returns (uint) {
        // Because solidity is a pain we need explicitly create the variables first
        uint[] memory values = new uint[](1);
        values[0] = value;

        address[] memory recipients = new address[](1);
        recipients[0] = recipient;

        address[] memory managers = new address[](1);
        managers[0] = manager;

        address[] memory referrers = new address[](1);
        referrers[0] = referrer;

        bytes[] memory datas = new bytes[](1);
        datas[0] = data;

        uint existingTokenId = 0;

        if (IPublicLockV12(lockAddress).totalKeys(recipient) > 0) {
            // By default extend the first one...
            existingTokenId = IPublicLockV12(lockAddress).tokenOfOwnerByIndex(
                recipient,
                0
            );
        }

        if (existingTokenId == 0) {
            return
                IPublicLockV12(lockAddress).purchase{value: msg.value}(
                    values,
                    recipients,
                    managers,
                    referrers,
                    datas
                )[0];
        } else {
            IPublicLockV12(lockAddress).extend{value: msg.value}(
                value,
                existingTokenId,
                referrer,
                data
            );
            return existingTokenId;
        }
    }

    /**
     * Function to approve purchases on a lock
     * @param lockAddress address of the lock contract
     * @param tokenAddress address of the ERC20 contract
     * @param amount amount to be approved
     */
    function approveLock(
        address lockAddress,
        address tokenAddress,
        uint amount
    ) public onlyOwner returns (bool) {
        return IERC20(tokenAddress).approve(lockAddress, amount);
    }
}
