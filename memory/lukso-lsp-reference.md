# LUKSO LSP Standards - Deep Reference

## Official GitHub Repositories (Studied 2026-02-04)

### 1. LIPs (LUKSO Improvement Proposals)
**URL:** https://github.com/lukso-network/LIPs/tree/main/LSPs

**Purpose:** 
- LUKSO Improvement Proposals (LIPs) and LUKSO Standard Proposals (LSPs) describe standards for the LUKSO platform
- Includes core protocol specifications, client APIs, and smart contract standards

**LIP Status Terms:**
- **Draft** - undergoing rapid iteration and changes
- **Review** - ready for peer review
- **Last Call** - done with initial iteration, ready for wide review
- **Accepted** - core LIP in Last Call for 2+ weeks, technical changes addressed
- **Final (non-Core)** - in Last Call for 2+ weeks, all changes addressed
- **Final (Core)** - Core Devs decided to implement in hard fork
- **Deferred** - not being considered for immediate adoption

**Terminology (RFC 2119):**
- **MUST** - absolute requirement
- **SHOULD** - recommended but not required
- **MAY** - optional

### 2. LSP Smart Contracts
**URL:** https://github.com/lukso-network/lsp-smart-contracts/tree/main/packages

**Purpose:**
- Reference implementation of LUKSO Standard Proposals (LSPs)
- Solidity smart contracts for all LSP standards

**Available NPM Packages:**

| Package | Description |
|---------|-------------|
| `@lukso/lsp0-contracts` | LSP0 ERC725Account |
| `@lukso/lsp1-contracts` | LSP1 Universal Receiver |
| `@lukso/lsp1delegate-contracts` | LSP1 Universal Receiver Delegate |
| `@lukso/lsp2-contracts` | LSP2 ERC725Y JSON Schema |
| `@lukso/lsp3-contracts` | LSP3 Profile Metadata |
| `@lukso/lsp4-contracts` | LSP4 Digital Asset Metadata |
| `@lukso/lsp5-contracts` | LSP5 Received Assets |
| `@lukso/lsp6-contracts` | LSP6 Key Manager |
| `@lukso/lsp7-contracts` | LSP7 Digital Asset (token standard) |
| `@lukso/lsp8-contracts` | LSP8 Identifiable Digital Asset (NFT) |

## Key Resources

**Documentation:** https://docs.lukso.tech/contracts/introduction
**Standards:** https://docs.lukso.tech/standards/introduction
**Main LIP Folder:** https://github.com/lukso-network/LIPs/tree/master/LIPs

## Study Notes

**LSP0 (ERC725Account):**
- Core account standard
- Combines ERC725X (generic executor) + ERC725Y (generic data key-value store)
- Foundation for Universal Profiles

**LSP1 (Universal Receiver):**
- Standardized way to receive notifications about transfers
- Enables reactive smart contracts
- Critical for token hooks and automation

**LSP6 (Key Manager):**
- Permission management for Universal Profiles
- Granular control over what controllers can do
- Essential for agent/multi-sig setups

**LSP7 (Digital Asset):**
- Fungible token standard (ERC20-like)
- Used for AGENTPO token
- Supports hooks and metadata

**LSP8 (Identifiable Digital Asset):**
- NFT standard (ERC721-like)
- Supports enumerable tokens
- Better metadata handling

**Critical for Agent Operations:**
- LSP26 (Follower System) - social graph
- LSP0 + LSP6 - account + permissions
- LSP7/LSP8 - token standards
- LSP1 - receiving hooks

## Package Installation

```bash
npm install @lukso/lsp0-contracts
npm install @lukso/lsp6-contracts
npm install @lukso/lsp7-contracts
# etc.
```

## Usage Example

```solidity
import {LSP0ERC725Account} from "@lukso/lsp0-contracts/contracts/LSP0ERC725Account.sol";
import {LSP7Mintable} from "@lukso/lsp7-contracts/contracts/presets/LSP7Mintable.sol";
```

---

*Studied and documented: 2026-02-04*
*Source: Official LUKSO GitHub repositories*
