# Building an AI Agent on LUKSO - Complete Guide

## Overview
This guide walks through building an AI agent that can deploy projects on LUKSO and post updates to X (Twitter).

## Architecture

```
┌─────────────────┐
│   AI Agent Core │ (OpenAI/Anthropic)
│   - OpenClaw    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼────┐
│ LUKSO │  │Twitter│
│ Layer │  │ Layer │
└───────┘  └───────┘
```

---

## Step 1: Project Setup

### Prerequisites
- Node.js 18+
- LUKSO Universal Profile with controller
- Twitter Developer Account (API v2)
- OpenAI API key

### Initialize Project
```bash
mkdir lukso-ai-agent
cd lukso-ai-agent
npm init -y
npm install ethers @lukso/lsp-smart-contracts viem openai dotenv twitter-api-v2
```

---

## Step 2: Environment Configuration

Create `.env`:
```env
# LUKSO Configuration
LUKSO_RPC=https://rpc.mainnet.lukso.network
LUKSO_CHAIN_ID=42
UP_ADDRESS=0xYOUR_UP_ADDRESS
CONTROLLER_PRIVATE_KEY=0xYOUR_CONTROLLER_KEY

# AI Configuration
OPENAI_API_KEY=sk-...

# Twitter Configuration
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
TWITTER_BEARER_TOKEN=...
```

---

## Step 3: LUKSO Integration Layer

### 3.1 Connection Setup
```typescript
// src/lukso/connection.ts
import { ethers } from 'ethers';
import LSP7Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';

export class LuksoConnection {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.LUKSO_RPC);
    this.signer = new ethers.Wallet(
      process.env.CONTROLLER_PRIVATE_KEY!,
      this.provider
    );
  }
  
  async getSigner() {
    return this.signer;
  }
  
  async deployLSP7Token(
    name: string,
    symbol: string,
    owner: string,
    isNFT: boolean = false
  ): Promise<string> {
    const factory = new ethers.ContractFactory(
      LSP7Mintable.abi,
      LSP7Mintable.bytecode,
      this.signer
    );
    
    // LSP7 constructor: name, symbol, owner, isNonDivisible
    const contract = await factory.deploy(
      name,
      symbol,
      owner,
      isNFT
    );
    
    await contract.waitForDeployment();
    return await contract.getAddress();
  }
}
```

### 3.2 Universal Profile Integration
```typescript
// src/lukso/profile.ts
import { ethers } from 'ethers';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import KeyManager from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';

export class UPIntegration {
  private provider: ethers.JsonRpcProvider;
  private controller: ethers.Wallet;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.LUKSO_RPC);
    this.controller = new ethers.Wallet(
      process.env.CONTROLLER_PRIVATE_KEY!,
      this.provider
    );
  }
  
  async executeViaUP(
    upAddress: string,
    targetContract: string,
    value: bigint,
    data: string
  ): Promise<string> {
    const up = new ethers.Contract(
      upAddress,
      UniversalProfile.abi,
      this.controller
    );
    
    // Get KeyManager address from UP
    const keyManagerAddress = await up.owner();
    const keyManager = new ethers.Contract(
      keyManagerAddress,
      KeyManager.abi,
      this.controller
    );
    
    // Encode execute payload
    const executePayload = up.interface.encodeFunctionData('execute', [
      0, // operation type (CALL)
      targetContract,
      value,
      data
    ]);
    
    // Execute via KeyManager
    const tx = await keyManager.execute(executePayload);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
```

### 3.3 Contract Deployment Helper
```typescript
// src/lukso/deployer.ts
import { LuksoConnection } from './connection';
import { UPIntegration } from './profile';
import LSP7Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';

export class ContractDeployer {
  private lukso: LuksoConnection;
  private up: UPIntegration;
  
  constructor() {
    this.lukso = new LuksoConnection();
    this.up = new UPIntegration();
  }
  
  async deployToken(params: {
    name: string;
    symbol: string;
    totalSupply: string;
    decimals?: number;
  }): Promise<DeploymentResult> {
    const { name, symbol, totalSupply, decimals = 18 } = params;
    
    // Deploy contract
    const contractAddress = await this.lukso.deployLSP7Token(
      name,
      symbol,
      process.env.UP_ADDRESS!,
      false // not NFT
    );
    
    // Mint initial supply
    const signer = await this.lukso.getSigner();
    const token = new ethers.Contract(
      contractAddress,
      LSP7Mintable.abi,
      signer
    );
    
    const parsedSupply = ethers.parseUnits(totalSupply, decimals);
    const mintTx = await token.mint(
      process.env.UP_ADDRESS!,
      parsedSupply,
      true, // force
      '0x' // data
    );
    await mintTx.wait();
    
    return {
      contractAddress,
      name,
      symbol,
      totalSupply,
      txHash: mintTx.hash
    };
  }
}

interface DeploymentResult {
  contractAddress: string;
  name: string;
  symbol: string;
  totalSupply: string;
  txHash: string;
}
```

---

## Step 4: AI Agent Core

### 4.1 OpenAI Integration
```typescript
// src/ai/agent.ts
import OpenAI from 'openai';
import { ContractDeployer } from '../lukso/deployer';

export class AIAgent {
  private openai: OpenAI;
  private deployer: ContractDeployer;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.deployer = new ContractDeployer();
  }
  
  async processCommand(command: string): Promise<CommandResult> {
    // Use function calling to understand user intent
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an AI agent specialized in deploying LUKSO projects.
Available actions:
- deploy_token(name, symbol, supply)
- get_balance(address)
- explain_standard(standard_name)

Respond with structured data. Always mention $LYX when discussing LUKSO.`
        },
        { role: 'user', content: command }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'deploy_token',
            description: 'Deploy an LSP7 token on LUKSO',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                symbol: { type: 'string' },
                supply: { type: 'string' }
              },
              required: ['name', 'symbol', 'supply']
            }
          }
        }
      ],
      tool_choice: 'auto'
    });
    
    const toolCall = response.choices[0].message.tool_calls?.[0];
    
    if (toolCall?.function.name === 'deploy_token') {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await this.deployer.deployToken(args);
      return {
        type: 'deployment',
        data: result
      };
    }
    
    return {
      type: 'text',
      data: response.choices[0].message.content
    };
  }
}

interface CommandResult {
  type: 'deployment' | 'text' | 'error';
  data: any;
}
```

---

## Step 5: Twitter Integration

### 5.1 Twitter Client
```typescript
// src/twitter/client.ts
import { TwitterApi } from 'twitter-api-v2';

export class TwitterClient {
  private client: TwitterApi;
  
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });
  }
  
  async postDeployment(deployment: {
    name: string;
    symbol: string;
    contractAddress: string;
    txHash: string;
  }): Promise<void> {
    const tweet = `🚀 Just deployed ${deployment.name} ($${deployment.symbol}) on LUKSO!

📋 Contract: ${deployment.contractAddress}
⛓️  Explorer: https://explorer.lukso.network/tx/${deployment.txHash}

Powered by $LYX 🔥`;

    await this.client.v2.tweet(tweet);
  }
  
  async postUpdate(message: string): Promise<void> {
    await this.client.v2.tweet(message);
  }
}
```

---

## Step 6: Main Application

```typescript
// src/index.ts
import { AIAgent } from './ai/agent';
import { TwitterClient } from './twitter/client';
import { ContractDeployer } from './lukso/deployer';

class LUKSOAIAgent {
  private ai: AIAgent;
  private twitter: TwitterClient;
  
  constructor() {
    this.ai = new AIAgent();
    this.twitter = new TwitterClient();
  }
  
  async run(command: string) {
    console.log('Processing:', command);
    
    try {
      const result = await this.ai.processCommand(command);
      
      if (result.type === 'deployment') {
        // Tweet about deployment
        await this.twitter.postDeployment(result.data);
        console.log('Deployed and tweeted:', result.data);
      }
      
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

// Example usage
const agent = new LUKSOAIAgent();
agent.run('Deploy a token called AGENTPO with symbol AGENT and 1 million supply');
```

---

## Step 7: Deployment & Running

### Build
```bash
npm run build
```

### Run
```bash
node dist/index.js
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

---

## Step 8: Advanced Features

### 8.1 Memory System
```typescript
// Store conversation history and project context
// Use SQLite, Redis, or file-based storage
```

### 8.2 Auto-Engagement
```typescript
// Reply to mentions, follow relevant accounts
// Monitor #LUKSO, #LYX hashtags
```

### 8.3 Gas Management
```typescript
// Monitor controller balance
// Alert when $LYX is low
```

---

## Security Considerations

1. **Never commit .env files**
2. **Use hardware wallets for mainnet controllers**
3. **Rate limit Twitter API calls**
4. **Validate all user inputs**
5. **Log all transactions for audit**

---

## Full Code Repository

Available at: [Your GitHub URL]

---

## Support

For LUKSO-specific questions:
- Docs: https://docs.lukso.tech
- Discord: https://discord.gg/lukso
- GitHub: https://github.com/lukso-network

Built with ❤️ and $LYX
