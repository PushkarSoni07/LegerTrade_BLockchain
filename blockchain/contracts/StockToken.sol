// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StockToken
 * @notice Represents simulated equity shares for a company.
 * @dev DISCLAIMER: For educational and academic simulation only.
 *      Not an investment product, security, or live stock share.
 */
contract StockToken is ERC20, Ownable {
    string public constant DISCLAIMER = "SIMULATED_EQUITY_TOKEN_NOT_REAL_SECURITY";
    string public companyName;
    string public simulatedIsin;

    mapping(address => bool) public authorizedSettlers;

    event SettlerUpdated(address indexed settler, bool isAuthorized);
    event StockMinted(address indexed to, uint256 amount);
    event StockBurned(address indexed from, uint256 amount);

    modifier onlySettlerOrOwner() {
        require(msg.sender == owner() || authorizedSettlers[msg.sender], "StockToken: unauthorized caller");
        _;
    }

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _companyName,
        string memory _simulatedIsin
    ) ERC20(_tokenName, _tokenSymbol) Ownable() {
        companyName = _companyName;
        simulatedIsin = _simulatedIsin;

        // Initial demo liquidity allocation: 1,000,000 simulated shares to owner
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function setAuthorizedSettler(address settler, bool isAuthorized) external onlyOwner {
        authorizedSettlers[settler] = isAuthorized;
        emit SettlerUpdated(settler, isAuthorized);
    }

    function mint(address to, uint256 amount) external onlySettlerOrOwner {
        _mint(to, amount);
        emit StockMinted(to, amount);
    }

    function burn(address from, uint256 amount) external onlySettlerOrOwner {
        _burn(from, amount);
        emit StockBurned(from, amount);
    }
}
