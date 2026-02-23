# LSP6 Shared UP / Mini-DAO Technical Architecture

## Overview

This document describes the technical architecture of the LSP6 Shared Universal Profile / Mini-DAO demonstration.

## Core Components

### 1. Universal Profile (LSP0 ERC725Account)

The Universal Profile is the core account that holds assets and executes transactions.

```solidity
contract UniversalProfile is ERC725X, ERC725Y {
    // ERC725X: Generic executor
    function execute(
        uint256 operation,
        address to,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory);
    
    // ERC725Y: Generic key-value store
    function setData(bytes32 key, bytes calldata value) external;
    function getData(bytes32 key) external view returns (bytes memory);
}
```

**Key Features:**
- Holds ETH and tokens
- Executes arbitrary calls
- Stores data in key-value format
- Owned by KeyManager (not EOA)

### 2. LSP6 KeyManager

The KeyManager is the permission layer that controls access to the Universal Profile.

```solidity
contract LSP6KeyManager {
    // Execute with permission check
    function execute(bytes calldata payload) external payable returns (bytes memory);
    
    // Execute relay call (gasless)
    function executeRelayCall(
        bytes calldata signature,
        uint256 nonce,
        bytes calldata payload
    ) external payable returns (bytes memory);
    
    // Get nonce for replay protection
    function getNonce(address signer, uint256 channel) external view returns (uint256);
}
```

**Key Features:**
- Verifies controller permissions before execution
- Supports relay calls for gasless transactions
- Nonce-based replay protection
- Granular permission system

## Permission System

### Permission Key Format

Permissions are stored in the Universal Profile using a specific key format:

```
0x4b80742d00000000c6dd0000<controller_address>
```

Where:
- `0x4b80742d00000000c6dd0000` is the LSP6 permission key prefix
- `<controller_address>` is the 20-byte address of the controller

### Permission Bitmask

Permissions are represented as a 32-byte value with specific bits set:

```
Bit 0 (0x01): CHANGE_OWNER
Bit 1 (0x02): ADD_CONTROLLER
Bit 2 (0x04): EDIT_PERMISSIONS
Bit 3 (0x08): ADD_EXTENSION
Bit 4 (0x10): CHANGE_EXTENSION

Bit 8 (0x100): EXECUTE
Bit 9 (0x200): EXECUTE_CALL
Bit 10 (0x400): EXECUTE_DELEGATECALL
Bit 11 (0x800): EXECUTE_STATICCALL

Bit 16 (0x10000): SETDATA
Bit 17 (0x20000): SUPER_SETDATA

Bit 18 (0x40000): SIGN
Bit 19 (0x80000): BATCH_CALLS
```

### Permission Verification

```typescript
function hasPermission(permissions: string, permission: string): boolean {
    const perms = BigInt(permissions);
    const check = BigInt(permission);
    return (perms & check) === check;
}
```

## Controller Roles

### 1. Admin
- **Permissions**: ALL (0xffff...ffff)
- **Capabilities**: Full control
- **Use Case**: Deployer/owner

### 2. Executor
- **Permissions**: EXECUTE + EXECUTE_CALL (0x300)
- **Capabilities**: 
  - Execute transfers
  - Call contracts
- **Use Case**: Trading agent, transaction executor

### 3. Data Manager
- **Permissions**: SETDATA + SUPER_SETDATA (0x30000)
- **Capabilities**:
  - Update profile metadata
  - Manage data keys
- **Use Case**: Profile manager, metadata updater

### 4. Signer
- **Permissions**: SIGN (0x40000)
- **Capabilities**:
  - Sign messages
  - Create off-chain signatures
- **Use Case**: Message signer, off-chain validator

### 5. Limited Executor
- **Permissions**: EXECUTE only (0x100)
- **Capabilities**:
  - Basic transfers only
  - No contract calls
- **Use Case**: Limited access agent

## Transaction Flows

### Standard Execution Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐
│  Controller │───>│  KeyManager  │───>│   Validate  │───>│ UniversalProfile │
│   (EOA)     │    │   execute()  │    │ Permissions │    │    execute()     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────────┘
                                              │                    │
                                              ▼                    ▼
                                        ┌──────────┐        ┌──────────┐
                                        │  Check   │        │ Execute  │
                                        │  Perms   │        │  Call    │
                                        └──────────┘        └──────────┘
```

### Relay Call Flow

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│  Controller │───>│ Sign Payload│───>│  Relayer     │
│   (EOA)     │    │  (off-chain)│    │  (any EOA)   │
└─────────────┘    └─────────────┘    └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ KeyManager   │
                                       │executeRelay  │
                                       │   Call()     │
                                       └──────────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                   ┌──────────┐        ┌──────────┐        ┌──────────┐
                   │ Recover  │        │ Validate │        │ Execute  │
                   │ Signature│        │  Nonce   │        │ Payload  │
                   └──────────┘        └──────────┘        └──────────┘
```

## Security Considerations

### 1. Permission Enforcement
- All transactions MUST go through KeyManager
- KeyManager validates permissions before execution
- Invalid permissions result in revert

### 2. Replay Protection
- Nonce-based replay protection
- Each controller has independent nonce
- Channel support for concurrent transactions

### 3. Permission Inheritance
- Permissions are checked bitwise
- Combined permissions are additive
- No automatic permission inheritance

### 4. Admin Control
- Admin can add/remove controllers
- Admin can modify permissions
- Admin should be secured appropriately

## Gas Optimization

### Batch Transactions
Multiple operations in a single transaction:

```solidity
function executeBatch(
    uint256[] operations,
    address[] targets,
    uint256[] values,
    bytes[] datas
)
```

**Benefits:**
- Single permission check
- Reduced gas overhead
- Atomic execution

### Relay Calls
Gasless transactions for end users:

```solidity
function executeRelayCall(
    bytes signature,
    uint256 nonce,
    bytes payload
)
```

**Benefits:**
- Users don't need ETH for gas
- Relayer can be subsidized
- Better UX for onboarding

## Implementation Patterns

### Pattern 1: Sub-Agent Coordination
```typescript
// Each OpenClaw sub-agent has a specific role
const subAgents = {
    trader: { permissions: PERMISSIONS.EXECUTE },      // Executes trades
    analyst: { permissions: PERMISSIONS.SETDATA },     // Updates analysis
    validator: { permissions: PERMISSIONS.SIGN }       // Signs approvals
};
```

### Pattern 2: Multi-Sig Lite
```typescript
// Require multiple signatures for high-value operations
// Each controller has limited permissions
// Admin required for sensitive operations
```

### Pattern 3: Time-Locked Operations
```typescript
// Combine with time-lock for enhanced security
// Set data with delay
// Emergency override by admin
```

## Integration with OpenClaw

### Sub-Agent Registration
```typescript
// Register an OpenClaw sub-agent as a controller
await setControllerPermissions(
    keyManager,
    universalProfile,
    subAgentAddress,
    PERMISSIONS.EXECUTOR,  // Limited to execution
    adminSigner
);
```

### Sub-Agent Execution
```typescript
// Sub-agent executes via the shared UP
const receipt = await executeThroughKeyManager(
    keyManager,
    universalProfile,
    OPERATION_CALL,
    target,
    value,
    data,
    subAgentSigner
);
```

### Permission Auditing
```typescript
// Verify sub-agent permissions
const hasExecute = await verifyPermissions(
    universalProfile,
    subAgentAddress,
    PERMISSIONS.EXECUTE
);
```

## Testing Strategy

### Unit Tests
- Permission calculation
- Key generation
- Role assignments

### Integration Tests
- Full transaction flows
- Permission enforcement
- Relay call execution

### Scenario Tests
- Multi-controller coordination
- Batch transaction execution
- Controller lifecycle (add/remove/update)

## References

- [LUKSO LSP6 Standard](https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager)
- [ERC725 Standard](https://docs.lukso.tech/standards/lsp-background/erc725)
- [LSP0 ERC725Account](https://docs.lukso.tech/standards/universal-profile/lsp0-erc725account)
