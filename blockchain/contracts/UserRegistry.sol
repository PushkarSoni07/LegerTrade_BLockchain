// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserRegistry
 * @notice Manages participant identities, roles, and simulated KYC status.
 * @dev DISCLAIMER: For educational/academic simulation only. No real identity or KYC verification is performed.
 */
contract UserRegistry is Ownable {
    enum Role { NONE, INVESTOR, BROKER, AUDITOR, REGULATOR }
    enum KycStatus { NOT_SUBMITTED, PENDING, APPROVED, REJECTED }

    struct UserProfile {
        address walletAddress;
        string demoUsername;
        Role role;
        KycStatus kycStatus;
        uint256 registeredAt;
        bool isActive;
    }

    mapping(address => UserProfile) private _users;
    address[] private _userAddresses;

    event UserRegistered(address indexed wallet, string demoUsername, Role role);
    event RoleUpdated(address indexed wallet, Role oldRole, Role newRole);
    event KycStatusUpdated(address indexed wallet, KycStatus oldStatus, KycStatus newStatus);
    event UserStatusToggled(address indexed wallet, bool isActive);

    modifier onlyRegistered(address wallet) {
        require(_users[wallet].walletAddress != address(0), "UserRegistry: user not registered");
        _;
    }

    modifier onlyActive(address wallet) {
        require(_users[wallet].isActive, "UserRegistry: user account is deactivated");
        _;
    }

    constructor() Ownable() {}

    /**
     * @notice Register a new participant with a demo role and approved demo KYC.
     */
    function registerUser(
        address wallet,
        string calldata demoUsername,
        Role role,
        KycStatus kycStatus
    ) external onlyOwner {
        require(wallet != address(0), "UserRegistry: invalid wallet address");
        require(role != Role.NONE, "UserRegistry: role cannot be NONE");
        require(bytes(demoUsername).length > 0, "UserRegistry: username required");

        if (_users[wallet].walletAddress == address(0)) {
            _userAddresses.push(wallet);
        }

        _users[wallet] = UserProfile({
            walletAddress: wallet,
            demoUsername: demoUsername,
            role: role,
            kycStatus: kycStatus,
            registeredAt: block.timestamp,
            isActive: true
        });

        emit UserRegistered(wallet, demoUsername, role);
        emit KycStatusUpdated(wallet, KycStatus.NOT_SUBMITTED, kycStatus);
    }

    /**
     * @notice Self-registration for demo investors.
     */
    function selfRegisterInvestor(string calldata demoUsername) external {
        require(bytes(demoUsername).length > 0, "UserRegistry: username required");
        require(_users[msg.sender].walletAddress == address(0), "UserRegistry: already registered");

        _userAddresses.push(msg.sender);
        _users[msg.sender] = UserProfile({
            walletAddress: msg.sender,
            demoUsername: demoUsername,
            role: Role.INVESTOR,
            kycStatus: KycStatus.APPROVED, // Auto-approve for seamless student demo
            registeredAt: block.timestamp,
            isActive: true
        });

        emit UserRegistered(msg.sender, demoUsername, Role.INVESTOR);
        emit KycStatusUpdated(msg.sender, KycStatus.NOT_SUBMITTED, KycStatus.APPROVED);
    }

    function setKycStatus(address wallet, KycStatus newStatus) external onlyOwner onlyRegistered(wallet) {
        KycStatus oldStatus = _users[wallet].kycStatus;
        _users[wallet].kycStatus = newStatus;
        emit KycStatusUpdated(wallet, oldStatus, newStatus);
    }

    function setRole(address wallet, Role newRole) external onlyOwner onlyRegistered(wallet) {
        Role oldRole = _users[wallet].role;
        _users[wallet].role = newRole;
        emit RoleUpdated(wallet, oldRole, newRole);
    }

    function toggleUserActive(address wallet) external onlyOwner onlyRegistered(wallet) {
        _users[wallet].isActive = !_users[wallet].isActive;
        emit UserStatusToggled(wallet, _users[wallet].isActive);
    }

    function getUser(address wallet) external view returns (UserProfile memory) {
        return _users[wallet];
    }

    function isKycApproved(address wallet) external view returns (bool) {
        return _users[wallet].isActive && (_users[wallet].kycStatus == KycStatus.APPROVED);
    }

    function hasRole(address wallet, Role role) external view returns (bool) {
        return _users[wallet].isActive && (_users[wallet].role == role);
    }

    function getTotalUsers() external view returns (uint256) {
        return _userAddresses.length;
    }

    function getUserAddressByIndex(uint256 index) external view returns (address) {
        require(index < _userAddresses.length, "UserRegistry: index out of bounds");
        return _userAddresses[index];
    }
}
