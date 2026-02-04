# LUKSO LSP Standards - Deep Dive

*Studied from official LIPs: 2026-02-04*

---

## LSP0 - ERC725Account (The Foundation)

**Status:** Draft  
**Interface ID:** `0x24871b3d`  
**Purpose:** Digital identity smart contract account

### What It Is
LSP0 is the **core account standard** - a digital passport representing humans, machines, organizations, or smart devices. It's a smart contract account that overcomes limitations of traditional EOAs (Externally Owned Accounts).

### Key Functionalities

| Feature | Standard | Description |
|---------|----------|-------------|
| **Dynamic Information** | ERC725Y | Add generic data post-deployment |
| **Generic Execution** | ERC725X | Interact with contracts, transfer tokens, create contracts |
| **Signature Verification** | ERC1271 | Verify signatures on behalf of account |
| **Notifications** | LSP1 | React to incoming assets/information |
| **Secured Ownership** | LSP14 | 2-step ownership transfer |
| **Future-Proof** | LSP17 | Extend with new functions over time |
| **Easy Interaction** | LSP20 | Direct calls from non-owners with verification |

### Why Not EOA?

**EOA Limitations:**
- ❌ No data storage (can't store profile info, assets list, etc.)
- ❌ Weak security (one private key = total control)
- ❌ No shared control (can't delegate without giving full access)
- ❌ No internal tracking (must rely on external explorers)

**Smart Contract Account Advantages:**
- ✅ Dynamic storage (LSP3 for profile, LSP5 for assets, LSP10 for vaults)
- ✅ Upgradeable security (multisig, permission-based access)
- ✅ Delegation (grant specific rights without full control)
- ✅ Extended operations (delegatecall, staticcall, create2)
- ✅ Automated reactions (LSP1 UniversalReceiver)

### Interface Cheat Sheet

```solidity
// ERC725X - Execute operations
function execute(uint256 operation, address to, uint256 value, bytes memory data) external payable returns (bytes memory);
function executeBatch(uint256[] memory operations, address[] memory targets, uint256[] memory values, bytes[] memory datas) external payable returns (bytes[] memory);

// ERC725Y - Data storage
function getData(bytes32 dataKey) external view returns (bytes memory);
function setData(bytes32 dataKey, bytes memory dataValue) external;
function getDataBatch(bytes32[] memory dataKeys) external view returns (bytes[] memory);
function setDataBatch(bytes32[] memory dataKeys, bytes[] memory dataValues) external;

// ERC1271 - Signature verification
function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4);

// LSP1 - Universal Receiver
function universalReceiver(bytes32 typeId, bytes memory data) external payable returns (bytes memory);

// LSP14 - Ownable2Step
function owner() external view returns (address);
function transferOwnership(address newOwner) external;
function acceptOwnership() external;

// LSP20 - Call Verification
function lsp20VerifyCall(address caller, uint256 value, bytes memory receivedCalldata) external returns (bytes4);
function lsp20VerifyCallResult(bytes32 callHash, bytes memory callResult) external returns (bytes4);

// LSP0 Specific
function batchCalls(bytes[] memory data) external returns (bytes[] memory results);
```

---

## LSP6 - Key Manager (The Brain)

**Status:** Draft  
**Interface ID:** `0x23f34c62`  
**Purpose:** Permission-based access control for ERC725 accounts

### What It Is
LSP6 is the **permission system** that controls who can do what with a Universal Profile. It acts as a gateway, restricting actions based on set permissions.

### Key Concept
- The **ERC725Account** holds the assets and data
- The **KeyManager** controls who can access/modify it
- **Permissions** are stored in the ERC725Y data store
- Multiple controllers can have different permission levels

### Permission System

**Main Permissions (bytes32):**

| Permission | Hex | Description |
|------------|-----|-------------|
| CHANGEOWNER | `0x0000000000000000000000000000000000000000000000000000000000000001` | Change account owner |
| ADDCONTROLLER | `0x0000000000000000000000000000000000000000000000000000000000000002` | Add new controllers |
| EDITPERMISSIONS | `0x0000000000000000000000000000000000000000000000000000000000000004` | Edit permissions |
| ADDEXTENSIONS | `0x0000000000000000000000000000000000000000000000000000000000000008` | Add contract extensions |
| CHANGEEXTENSIONS | `0x0000000000000000000000000000000000000000000000000000000000000010` | Change extensions |
| ADDUNIVERSALRECEIVERDELEGATE | `0x0000000000000000000000000000000000000000000000000000000000000020` | Add LSP1 delegates |
| CHANGEUNIVERSALRECEIVERDELEGATE | `0x0000000000000000000000000000000000000000000000000000000000000040` | Change LSP1 delegates |
| REENTRANCY | `0x0000000000000000000000000000000000000000000000000000000000000080` | Allow reentrant calls |
| SUPER_TRANSFERVALUE | `0x0000000000000000000000000000000000000000000000000000000000000100` | Transfer any value |
| TRANSFERVALUE | `0x0000000000000000000000000000000000000000000000000000000000000200` | Transfer value (restricted) |
| SUPER_CALL | `0x0000000000000000000000000000000000000000000000000000000000000400` | Call any contract |
| CALL | `0x0000000000000000000000000000000000000000000000000000000000000800` | Call contracts (restricted) |
| SUPER_STATICCALL | `0x0000000000000000000000000000000000000000000000000000000000001000` | Static call any contract |
| STATICCALL | `0x0000000000000000000000000000000000000000000000000000000000002000` | Static call (restricted) |
| SUPER_DELEGATECALL | `0x0000000000000000000000000000000000000000000000000000000000004000` | Delegate call any contract |
| DELEGATECALL | `0x0000000000000000000000000000000000000000000000000000000000008000` | Delegate call (restricted) |
| DEPLOY | `0x0000000000000000000000000000000000000000000000000000000000010000` | Deploy contracts |
| SUPER_SETDATA | `0x0000000000000000000000000000000000000000000000000000000000020000` | Set any data key |
| SETDATA | `0x0000000000000000000000000000000000000000000000000000000000040000` | Set data (restricted) |
| ENCRYPT | `0x0000000000000000000000000000000000000000000000000000000000080000` | Encryption operations |
| DECRYPT | `0x0000000000000000000000000000000000000000000000000000000000100000` | Decryption operations |
| SIGN | `0x0000000000000000000000000000000000000000000000000000000000200000` | Sign on behalf of UP |
| EXECUTERELAYCALL | `0x0000000000000000000000000000000000000000000000000000000000400000` | Execute relay calls |

### Restrictions

Controllers can be restricted to:
- **Specific addresses** (only interact with certain contracts)
- **Specific functions** (only call certain methods)
- **Specific standards** (only interact with contracts supporting certain interfaces)

### Transaction Flow

```
1. Controller calls KeyManager.execute(...) or executeRelayCall(...)
2. KeyManager verifies permissions
3. KeyManager calls target ERC725Account
4. ERC725Account executes the operation
5. Result returned through KeyManager
```

### Interface Cheat Sheet

```solidity
function target() external view returns (address);
function execute(bytes memory payload) external payable returns (bytes memory);
function executeBatch(bytes[] memory payloads) external payable returns (bytes[] memory);

// Relay calls (gasless)
function executeRelayCall(
    bytes memory signature,
    uint256 nonce,
    uint256 validityTimestamps,
    bytes memory payload
) external payable returns (bytes memory);

function executeRelayCallBatch(
    bytes[] memory signatures,
    uint256[] memory nonces,
    uint256[] memory validityTimestamps,
    uint256[] memory values,
    bytes[] memory payloads
) external payable returns (bytes[] memory);

// Permission verification
function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4);
function lsp20VerifyCall(address caller, uint256 value, bytes memory receivedCalldata) external returns (bytes4);
function lsp20VerifyCallResult(bytes32 callHash, bytes memory callResult) external returns (bytes4);

// Nonce management
function getNonce(address from, uint128 channelId) external view returns (uint256);
```

---

## LSP7 - Digital Asset (The Token)

**Status:** Review  
**Interface ID:** `0xc52d6008`  
**Purpose:** Fungible and non-fungible token standard

### What It Is
LSP7 is the **token standard** for LUKSO. It can represent both fungible tokens (like AGENTPO) and non-fungible tokens (NFTs).

### Key Features

| Feature | Description |
|---------|-------------|
| **Dynamic Metadata** | Uses ERC725Y for rich, extensible metadata (LSP4) |
| **Secure Transfers** | Checks if recipient can handle tokens before transfer |
| **Transfer Notifications** | Notifies sender, recipient, and operators about transfers |
| **Future-Proof** | Extendable via LSP17 |
| **Batch Transfers** | Transfer multiple tokens in one call |
| **Multiple Operators** | Multiple addresses can manage tokens |

### LSP7 vs ERC20/ERC721

| Feature | LSP7 | ERC20 | ERC721 |
|---------|------|-------|--------|
| Metadata | Rich (LSP4) | Limited (name, symbol) | Limited (tokenURI) |
| Notification | ✅ LSP1 | ❌ | ❌ |
| Batch transfer | ✅ | ❌ | ❌ |
| Multiple operators | ✅ | ❌ (only approve) | ✅ |
| Discoverability | ✅ | ❌ | ❌ |
| Token loss protection | ✅ | ❌ | ❌ |

### Core Functions

```solidity
// Token info
function decimals() external view returns (uint8);
function totalSupply() external view returns (uint256);
function balanceOf(address tokenOwner) external view returns (uint256);

// Operators
function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData) external;
function revokeOperator(address operator, address tokenOwner, bool notify, bytes memory operatorNotificationData) external;
function increaseAllowance(address operator, uint256 addedAmount, bytes memory operatorNotificationData) external;
function decreaseAllowance(address operator, uint256 subtractedAmount, bytes memory operatorNotificationData) external;
function isOperatorFor(address operator, address tokenOwner) external view returns (uint256);
function getOperatorsOf(address tokenOwner) external view returns (address[] memory);

// Transfers
function transfer(address from, address to, uint256 amount, bool force, bytes memory data) external;
function transferBatch(
    address[] memory from,
    address[] memory to,
    uint256[] memory amount,
    bool[] memory force,
    bytes[] memory data
) external;

// Metadata (ERC725Y)
function getData(bytes32 dataKey) external view returns (bytes memory);
function setData(bytes32 dataKey, bytes memory dataValue) external;
```

### The `force` Parameter

**Critical for LSP7 transfers!**

When `force = false`:
- Contract checks if recipient implements LSP1 (UniversalReceiver)
- If recipient is a contract without LSP1, transfer **reverts**
- Prevents accidental token loss

When `force = true`:
- Transfer proceeds regardless
- Use with caution!

### LSP1 Hooks (UniversalReceiver)

When tokens are transferred, these notifications are sent:

**Operator Notification:**
- Type ID: `keccak256('LSP7Tokens_OperatorNotification')` = `0x386072cc...`
- Data: `abi.encode(tokenOwner, amount, operatorNotificationData)`

**Token Notification (to recipient):**
- Type ID: `keccak256('LSP7Tokens_RecipientNotification')`
- Data: `abi.encode(sender, recipient, amount, data)`

### AGENTPO Example

```solidity
// Deploy LSP7 token (AGENTPO)
contract AGENTPO is LSP7DigitalAsset {
    constructor()
        LSP7DigitalAsset(
            "AGENTPO",           // name
            "AGENT",             // symbol
            msg.sender,          // owner
            0,                   // token type (0 = token, 1 = NFT)
            false                // isNonDivisible (false = 18 decimals)
        )
    {
        // Mint 800,000 tokens
        _mint(msg.sender, 800000 * 10**18, true, "");
    }
}
```

---

## LSP1 - Universal Receiver (The Notification System)

**Interface ID:** `0x6bb56a14`

### What It Is
LSP1 allows smart contracts to **receive notifications** about incoming transfers, information, or any other actions.

### Why It Matters
- **Reactive contracts**: Automatically respond to incoming tokens
- **No token loss**: Reject unwanted tokens
- **Automation**: Forward, log, or process incoming assets

### Interface

```solidity
function universalReceiver(bytes32 typeId, bytes memory data) external payable returns (bytes memory);
function universalReceiverDelegate(address caller, uint256 value, bytes32 typeId, bytes memory data) external payable returns (bytes4);
```

### Common Type IDs

| Type ID | Description |
|---------|-------------|
| `keccak256('LSP7Tokens_OperatorNotification')` | Operator authorized |
| `keccak256('LSP7Tokens_RecipientNotification')` | LSP7 tokens received |
| `keccak256('LSP8Tokens_OperatorNotification')` | LSP8 operator authorized |
| `keccak256('LSP8Tokens_RecipientNotification')` | LSP8 NFT received |
| `keccak256('LSP14OwnershipTransferStarted')` | Ownership transfer initiated |
| `keccak256('LSP14OwnershipTransferred')` | Ownership transferred |

---

## LSP26 - Follower System (Social Graph)

**Status:** Draft  
**Contract:** `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA`

### What It Is
LSP26 enables **social graph functionality** on-chain. Universal Profiles can follow other Universal Profiles.

### Key Features
- Follow/unfollow addresses
- Get list of followers
- Get list of following
- Batch operations

### Important Note
**The contract reverts entire batch if any address is already being followed!** Must check first or use one-by-one.

```solidity
// LSP26 Interface
function follow(address[] calldata addresses) external;
function unfollow(address[] calldata addresses) external;
function isFollowing(address follower, address followed) external view returns (bool);
function getFollows(address follower) external view returns (address[] memory);
function getFollowers(address followed, uint256 startIndex, uint256 endIndex) external view returns (address[] memory);
function getFollowersCount(address followed) external view returns (uint256);
```

---

## Practical Integration Patterns

### 1. Deploy Universal Profile

```solidity
// Step 1: Deploy ERC725Account
ERC725Account account = new ERC725Account(owner);

// Step 2: Deploy KeyManager
KeyManager keyManager = new KeyManager(address(account));

// Step 3: Transfer ownership to KeyManager
account.transferOwnership(address(keyManager));
keyManager.acceptOwnership();

// Step 4: Set permissions for controllers
bytes32[] memory keys = new bytes32[](1);
bytes[] memory values = new bytes[](1);
keys[0] = keccak256(abi.encodePacked("0x...controller_address..."));
values[0] = abi.encodePacked(uint256(0x02 | 0x04 | 0x200 | 0x40000)); // ADDCONTROLLER | EDITPERMISSIONS | CALL | SETDATA
keyManager.execute(abi.encodeWithSelector(
    account.setDataBatch.selector,
    keys,
    values
));
```

### 2. Deploy LSP7 Token

```solidity
import {LSP7Mintable} from "@lukso/lsp7-contracts/contracts/presets/LSP7Mintable.sol";

LSP7Mintable token = new LSP7Mintable(
    "MyToken",
    "MTK",
    msg.sender,  // owner
    0,           // token type (0 = divisible token, 1 = NFT)
    false        // isNonDivisible
);

// Mint tokens
token.mint(recipient, amount, true, "");
```

### 3. Execute Via KeyManager

```javascript
// Using ethers.js
const payload = account.interface.encodeFunctionData("execute", [
    0,           // operation (0 = call)
    targetAddress,
    value,
    callData
]);

await keyManager.connect(controller).execute(payload);
```

### 4. Gasless Transaction (Relay Call)

```javascript
// Sign relay call
const nonce = await keyManager.getNonce(controllerAddress, channelId);
const validityTimestamps = 0; // No expiration
const payload = account.interface.encodeFunctionData("execute", [...]);

const message = ethers.utils.solidityKeccak256(
    ["bytes"],
    [payload]
);

const signature = await controller.signMessage(ethers.utils.arrayify(message));

// Anyone can execute
await keyManager.executeRelayCall(
    signature,
    nonce,
    validityTimestamps,
    payload,
    { value: msgValue }
);
```

---

## Resources

**Official Documentation:**
- https://docs.lukso.tech/standards/introduction
- https://docs.lukso.tech/contracts/introduction

**GitHub Repositories:**
- LIPs (Specifications): https://github.com/lukso-network/LIPs/tree/main/LSPs
- Smart Contracts: https://github.com/lukso-network/lsp-smart-contracts

**NPM Packages:**
```bash
npm install @lukso/lsp0-contracts
npm install @lukso/lsp6-contracts
npm install @lukso/lsp7-contracts
npm install @lukso/lsp8-contracts
```

---

*This document is a deep technical reference for the core LSP standards. For specific implementation questions, refer to the official LUKSO documentation.*
