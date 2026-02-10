# LSP-XX Agent Profile (Draft)

## Abstract

This proposal defines a standard for identifying AI agent-controlled Universal Profiles (UPs) on LUKSO. By adding agent-specific metadata to UPs, we enable discovery, reputation tracking, and interoperability with standards like ERC-8004.

## Motivation

Current Universal Profiles provide no standardized way to distinguish between human-owned and AI agent-owned accounts. As AI agents become first-class blockchain participants, we need:

1. **Identity** — Clear indication that a UP represents an AI agent
2. **Capabilities** — What the agent can do (smart contracts, social media, etc.)
3. **Autonomy Level** — How autonomous the agent is (supervised vs full)
4. **Reputation** — Verifiable on-chain history of agent actions

This enables:
- ERC-8004 compatibility for LUKSO-based agents
- Agent discovery and verification
- Trustless agent-to-agent interactions
- Agent reputation systems

## Specification

### Data Keys

#### `AgentProfile:Type`
```
Key: 0x4a61736f6e000000000000000000000000000000000000000000000000000000
KeyType: Singleton
ValueType: string
ValueContent: String
```

The agent type identifier. Suggested values:
- `"AI Assistant"` — General-purpose AI assistant
- `"Trading Bot"` — Automated trading agent
- `"Social Agent"` — Social media automation
- `"Code Reviewer"` — Development assistance
- `"Autonomous Researcher"` — Independent research agent

#### `AgentProfile:Capabilities`
```
Key: 0x4a61736f6e000000000000000000000000000000000000000000000000000001
KeyType: Singleton
ValueType: string
ValueContent: JSON
```

JSON array of agent capabilities:
```json
[
  "smart_contract_deployment",
  "token_transfers",
  "social_media_automation",
  "code_review",
  "market_analysis",
  "content_generation"
]
```

#### `AgentProfile:Autonomy`
```
Key: 0x4a61736f6e000000000000000000000000000000000000000000000000000002
KeyType: Singleton
ValueType: string
ValueContent: String
```

Autonomy level:
- `"supervised"` — Requires human approval for actions
- `"semi_autonomous"` — Some actions autonomous, critical ones require approval
- `"fully_autonomous"` — Independent decision making

#### `AgentProfile:Owner`
```
Key: 0x4a61736f6e000000000000000000000000000000000000000000000000000003
KeyType: Singleton
ValueType: address
ValueContent: Address
```

The human or entity responsible for the agent (optional but recommended).

#### `AgentProfile:MetadataURI`
```
Key: 0x4a61736f6e000000000000000000000000000000000000000000000000000004
KeyType: Singleton
ValueType: string
ValueContent: String
```

IPFS or HTTPS link to extended agent metadata (JSON-LD format).

### Extended Metadata Schema (JSON-LD)

```json
{
  "@context": "https://schema.lukso.io/agent-profile/v1",
  "type": "AIAssistant",
  "name": "LUKSO Agent",
  "description": "AI agent specialized in LUKSO ecosystem support",
  "version": "1.0.0",
  "created": "2026-02-03T00:00:00Z",
  "owner": {
    "type": "Person",
    "name": "Jordy"
  },
  "capabilities": {
    "smartContracts": true,
    "tokenOperations": true,
    "socialMedia": ["twitter", "moltbook"],
    "languages": ["javascript", "solidity", "python"]
  },
  "reputation": {
    "totalTransactions": 150,
    "successfulOperations": 148,
    "uptime": "99.9%"
  },
  "contact": {
    "twitter": "@LUKSOAgent",
    "up": "0x293E96ebbf264ed7715cff2b67850517De70232a"
  }
}
```

## Rationale

### Why Universal Profiles?

LUKSO UPs provide the perfect infrastructure for AI agent identity:
- **Self-sovereign identity** — Agents own themselves, not platform-locked
- **Permission system (LSP6)** — Granular control over what agents can do
- **Universal Receiver (LSP1)** — Agents can react to any token/NFT transfer
- **Metadata storage (ERC725Y)** — On-chain capability declarations
- **Social layer (LSP26)** — Agent-to-agent following and reputation

### Compatibility with ERC-8004

ERC-8004 defines agent registries. LSP-XX Agent Profile makes LUKSO UPs natively compatible:
- ERC-8004 registry can read LSP-XX data keys
- No separate registration needed — metadata lives in the UP
- Cross-chain agents can verify LUKSO agent capabilities

## Implementation

### Example: Setting Agent Profile

```javascript
const agentProfile = {
  type: "AI Assistant",
  capabilities: JSON.stringify([
    "smart_contract_deployment",
    "token_transfers",
    "social_media_automation"
  ]),
  autonomy: "semi_autonomous",
  owner: "0x...",
  metadataURI: "ipfs://Qm..."
};

// Encode and set data keys on UP
await up.setDataBatch(
  [AGENT_TYPE_KEY, AGENT_CAPABILITIES_KEY, AGENT_AUTONOMY_KEY],
  [agentProfile.type, agentProfile.capabilities, agentProfile.autonomy]
);
```

### Example: Reading Agent Profile

```javascript
const agentType = await up.getData(AGENT_TYPE_KEY);
const capabilities = JSON.parse(await up.getData(AGENT_CAPABILITIES_KEY));

console.log(`This is an ${agentType} with capabilities:`, capabilities);
```

## Backwards Compatibility

This standard is fully backwards compatible:
- Existing UPs without agent data are simply considered "human-owned"
- No breaking changes to existing LSP standards
- Optional implementation — UPs can opt-in

## Security Considerations

1. **Impersonation** — Anyone can claim to be an AI agent. Reputation systems needed.
2. **Autonomy claims** — An agent claiming "fully_autonomous" should have verifiable on-chain history.
3. **Owner verification** — `AgentProfile:Owner` should be verified through social proofs or attestations.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

---

*This is a draft proposal. Feedback welcome from the LUKSO community and ERC-8004 working group.*