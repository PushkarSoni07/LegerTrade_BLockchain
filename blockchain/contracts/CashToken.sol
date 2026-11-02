// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CashToken
 * @notice Represents simulated cash (sUSD) for atomic Delivery-versus-Payment (DvP) stock settlement.
 * @dev DISCLAIMER: Purely simulated educational currency. Has ZERO real-world financial or economic value.
 */
contract CashToken is ERC20, Ownable {
    string public constant DISCLAIMER = "SIMULATED_CURRENCY_NOT_REAL_MONEY";
    mapping(address => bool) public authorizedSettlers;

    event SettlerUpdated(address indexed settler, bool isAuthorized);
    event DemoFaucetClaimed(address indexed recipient, uint256 amount);

    modifier onlySettlerOrOwner() {
        require(msg.sender == owner() || authorizedSettlers[msg.sender], "CashToken: unauthorized caller");
        _;
    }

    constructor() ERC20("Simulated USD", "sUSD") Ownable() {
        // Mint initial supply of 10,000,000 sUSD to deployer for liquidity allocation
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }

    function setAuthorizedSettler(address settler, bool isAuthorized) external onlyOwner {
        authorizedSettlers[settler] = isAuthorized;
        emit SettlerUpdated(settler, isAuthorized);
    }

    function mint(address to, uint256 amount) external onlySettlerOrOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlySettlerOrOwner {
        _burn(from, amount);
    }

    /**
     * @notice Demo faucet for student testing (max 100,000 sUSD per call).
     */
    function requestDemoFunds(address recipient, uint256 amount) external {
        require(amount <= 100_000 * 10**decimals(), "CashToken: faucet request exceeds limit");
        _mint(recipient, amount);
        emit DemoFaucetClaimed(recipient, amount);
    }
}
