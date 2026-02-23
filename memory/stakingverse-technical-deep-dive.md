# Stakingverse Technical Deep Dive

## Overview

Stakingverse is a liquid staking protocol built on the LUKSO blockchain that allows users to stake LYX tokens while maintaining liquidity through the sLYX (Stakingverse Staked LYX) token. The protocol consists of two main smart contracts: the StakingverseVault and the SLYXToken.

## How sLYX Liquid Staking Works

### Core Concept
sLYX is a liquid staking token (LST) that represents staked LYX tokens in the Stakingverse protocol. Unlike traditional staking where assets are locked, sLYX provides liquidity while still earning staking rewards.

### Key Flows

#### 1. Deposit and Minting Process
1. **Direct Deposit**: Users can deposit LYX directly into the vault via the `deposit(address beneficiary)` function
2. **Stake Transfer**: Users can transfer existing staked LYX to the SLYXToken contract to mint sLYX tokens
3. **Minting Mechanism**: When LYX stake is transferred to the SLYXToken contract, it automatically mints equivalent sLYX tokens based on the current exchange rate

#### 2. Reward Accumulation
- sLYX is a **non-rebasing token** - the token quantity remains constant while its value increases
- Rewards accumulate in the underlying vault, increasing the LYX/sLYX exchange rate
- Users benefit from compounding rewards without additional transactions

#### 3. Withdrawal and Burning Process
1. **Burn sLYX**: Users call `burn(address from, uint256 amount, bytes data)` on the SLYXToken contract
2. **Conversion**: The contract calculates the equivalent LYX amount including accumulated rewards
3. **Transfer**: The vault transfers the LYX stake back to the user

## Contract Architecture

### StakingverseVault Contract (`0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04`)

The vault is the core staking contract that manages:
- **Deposits and withdrawals** of LYX tokens
- **Validator registration** on the LUKSO beacon chain
- **Reward distribution** and fee collection
- **Oracle-based rebalancing** of staked/unstaked balances

#### Key Storage Variables
```solidity
uint256 public depositLimit;           // Maximum total deposits
uint256 public totalShares;            // Total shares in the vault
uint256 public totalStaked;            // Active stake on beacon chain
uint256 public totalUnstaked;          // Inactive stake on execution layer
uint256 public totalPendingWithdrawal; // Pending withdrawals
uint256 public totalClaimable;         // Immediately claimable withdrawals
uint256 public totalFees;              // Available fees for withdrawal
uint32 public fee;                     // Fee percentage (parts per 100,000)
```

#### Key Functions
- `deposit(address beneficiary)`: Stake LYX in the vault
- `withdraw(uint256 amount, address beneficiary)`: Withdraw staked LYX
- `claim(uint256 amount, address beneficiary)`: Claim pending withdrawals
- `rebalance()`: Oracle function to update staked/unstaked balances
- `registerValidator(bytes pubkey, bytes signature, bytes32 depositDataRoot)`: Register new validators

### SLYXToken Contract (`0x8a3982f0A7d154D11a5f43EEc7F50E52eBBc8F7d`)

The liquid staking token contract that:
- **Represents liquid stake** in the vault as transferable tokens
- **Implements LSP7 standard** for digital assets on LUKSO
- **Handles minting/burning** based on stake transfers
- **Calculates exchange rates** between LYX and sLYX

#### Key Functions
- `onVaultStakeReceived(address from, uint256 amount, bytes data)`: Mint sLYX when stake is transferred
- `burn(address from, uint256 amount, bytes data)`: Burn sLYX to reclaim stake
- `getNativeTokenValue(uint256 sLyxAmount)`: Calculate LYX value of sLYX
- `getSLYXTokenValue(uint256 stakedLyxAmount)`: Calculate sLYX value of LYX
- `getExchangeRate()`: Get current LYX/sLYX exchange rate

## How It Differs from Other LSTs

### Comparison with Lido (stETH)
| Feature | Stakingverse (sLYX) | Lido (stETH) |
|---------|---------------------|--------------|
| **Token Type** | Non-rebasing (LSP7) | Rebasing (ERC20) |
| **Reward Model** | Value appreciation | Quantity increase |
| **Blockchain** | LUKSO | Ethereum |
| **Standard** | LSP7 (LUKSO) | ERC20 |
| **Integration** | Universal Profiles | Standard EOAs |

### Comparison with Rocket Pool (rETH)
| Feature | Stakingverse (sLYX) | Rocket Pool (rETH) |
|---------|---------------------|-------------------|
| **Validator Model** | Centralized operator | Decentralized node operators |
| **Minimum Stake** | No minimum | 0.01 ETH |
| **Token Type** | Non-rebasing | Non-rebasing |
| **Fee Structure** | Variable (0-30%) | 15% commission |
| **Blockchain** | LUKSO | Ethereum |

### Unique Features
1. **LSP7 Standard**: Built on LUKSO's digital asset standard for better Universal Profile integration
2. **Universal Receiver**: Supports LUKSO's LSP1 standard for enhanced smart contract interactions
3. **Oracle-based Rebalancing**: Uses oracle system for accurate staked/unstaked balance tracking
4. **Flexible Fee Structure**: Configurable fees (0-30%) managed by operator

## Technical Details for Validators

### Validator Registration Process
1. **Oracle Initiation**: Only authorized oracles can register validators
2. **Deposit Requirements**: Each validator requires exactly 32 LYX (DEPOSIT_AMOUNT)
3. **Withdrawal Credentials**: Set to the vault contract address for proper reward routing
4. **Key Management**: Validator pubkeys are tracked to prevent duplicate registration

### Key Technical Parameters
```solidity
uint32 private constant _FEE_BASIS = 100_000;        // Basis points for fee calculation
uint32 private constant _MIN_FEE = 0;                // 0% minimum fee
uint32 private constant _MAX_FEE = 30_000;           // 30% maximum fee
uint256 private constant _MAX_VALIDATORS_SUPPORTED = 1_000_000; // Maximum validators
uint256 private constant _MINIMUM_REQUIRED_SHARES = 1e3; // Anti-inflation protection
```

### Security Measures
- **Reentrancy Protection**: All state-changing functions use ReentrancyGuard
- **Pausable Functions**: Emergency pause mechanism for critical functions
- **Access Control**: Role-based permissions for operators, oracles, and owners
- **Upgradeable Contracts**: Uses OpenZeppelin's upgradeable pattern

## Reward Distribution Mechanism

### Reward Accumulation
1. **Beacon Chain Rewards**: Validators earn consensus and execution layer rewards
2. **Vault Rebalancing**: Oracle periodically updates staked/unstaked balances
3. **Fee Deduction**: Protocol fees are subtracted from total rewards
4. **Value Appreciation**: Remaining rewards increase the LYX/sLYX exchange rate

### Rebalancing Process
The `rebalance()` function performs these calculations:
1. **Calculate Completed Withdrawals**: Determines how much stake has become available
2. **Update Staked Balance**: Reduces totalStaked by completed withdrawals
3. **Handle Claimable Amounts**: Updates immediately claimable withdrawals
4. **Process Rewards**: Calculates and distributes rewards after fee deduction

### Fee Structure
- **Fee Range**: 0% to 30% (configurable by operator)
- **Fee Basis**: Calculated on rewards only, not principal
- **Fee Recipient**: Designated address can claim accumulated fees
- **Subsidization**: Fees help prevent validator exits during low-reward periods

### Exchange Rate Calculation
```solidity
// Current exchange rate calculation
function getExchangeRate() external view returns (uint256) {
    return getNativeTokenValue(1 ether);
}

// LYX value of sLYX
function getNativeTokenValue(uint256 sLyxAmount) public view returns (uint256) {
    uint256 totalSLYXMinted = totalSupply();
    if (totalSLYXMinted == 0) return sLyxAmount;
    uint256 sLyxTokenContractStake = stakingVault.balanceOf(address(this));
    return sLyxAmount.mulDiv(sLyxTokenContractStake, totalSLYXMinted);
}
```

## Integration Considerations

### For DeFi Protocols
- **LSP7 Compatibility**: Ensure your protocol supports LUKSO's token standard
- **Exchange Rate Queries**: Use `getExchangeRate()` for accurate pricing
- **Universal Receiver**: Handle LSP1 notifications for sLYX transfers
- **Pause Status**: Check contract pause status before interactions

### For Wallet Providers
- **Token Detection**: sLYX uses LSP7 standard, not ERC20
- **Balance Display**: Show both sLYX balance and underlying LYX value
- **Reward Tracking**: Display accumulated rewards via exchange rate changes
- **Transfer Restrictions**: Prevent transfers to vault or token contract itself

### For Validators
- **Oracle Requirements**: Must be authorized by vault operator
- **Key Management**: Proper validator key generation and storage
- **Monitoring**: Track validator performance and rewards
- **Compliance**: Follow LUKSO validator requirements and best practices

## Risk Considerations

### Smart Contract Risks
- **Upgrade Risk**: Contracts are upgradeable, requiring trust in governance
- **Oracle Risk**: Rebalancing depends on accurate oracle data
- **Centralization Risk**: Single operator controls key parameters
- **Slashing Risk**: Validator penalties could affect user funds

### Market Risks
- **Liquidity Risk**: sLYX liquidity depends on market makers and DeFi integrations
- **Exchange Rate Risk**: sLYX/LYX rate fluctuates based on rewards and market conditions
- **Depeg Risk**: Potential deviation from underlying LYX value

### Mitigation Measures
- **Audits**: Contracts have undergone security audits
- **Testing**: Comprehensive test suite with high coverage
- **Monitoring**: Active monitoring of contract operations
- **Emergency Functions**: Pause mechanisms for emergency situations

## Conclusion

Stakingverse represents a sophisticated liquid staking solution tailored for the LUKSO ecosystem. Its non-rebasing token model, LSP7 standard implementation, and oracle-based rebalancing mechanism differentiate it from Ethereum-based alternatives. The protocol offers users the benefits of liquid staking while maintaining the security and decentralization principles of the LUKSO network.

The technical architecture demonstrates careful consideration of the unique aspects of the LUKSO blockchain, particularly its Universal Profile system and LSP standards. For developers, validators, and users, understanding these technical details is crucial for safe and effective integration with the protocol.