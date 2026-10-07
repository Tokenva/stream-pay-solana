// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenvaM11Token is ERC20, ERC20Burnable, Ownable {
    address public minter;

    error CallerNotMinter();

    constructor()
        ERC20("Tokenva Test Token", "SPT")
        Ownable(msg.sender)
    {
        minter = msg.sender;
        _mint(msg.sender, 1_000_000_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address account, uint256 amount) external {
        if (msg.sender != minter) revert CallerNotMinter();
        _mint(account, amount);
    }

    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "zero minter");
        minter = newMinter;
    }
}