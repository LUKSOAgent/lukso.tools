# LUKSO Developer Patterns and Examples

This document provides comprehensive guidance on LUKSO development patterns, code examples, and best practices for building decentralized applications on the LUKSO blockchain. It covers Universal Profile interactions, mini-app development, key integration patterns, and essential developer tools.

## Table of Contents

1. [Core Technologies and Libraries](#core-technologies-and-libraries)
2. [Universal Profile Development Patterns](#universal-profile-development-patterns)
3. [Mini-App Development](#mini-app-development)
4. [Wallet Connection and Authentication](#wallet-connection-and-authentication)
5. [Transaction Patterns](#transaction-patterns)
6. [Profile and Asset Management](#profile-and-asset-management)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)

## Core Technologies and Libraries

### Essential LUKSO Libraries

**@erc725/erc725.js**
- Primary library for interacting with ERC725 contracts and Universal Profiles
- Handles profile metadata fetching and LSP standard interactions
- Version: 0.28.1 (playground) / 0.27.2 (mini-app template)

**@lukso/lsp-smart-contracts**
- Complete collection of LUKSO Standard Proposals (LSP) implementations
- Provides pre-built contracts for LSP7 (tokens), LSP8 (NFTs), and other standards
- Version: 0.16.7

**@lukso/up-provider**
- Universal Profile wallet connection provider for browser extensions
- Enables seamless integration with UP Browser Extension
- Version: 0.3.5

**@lukso/web-components**
- Ready-to-use UI components with LUKSO branding
- Includes profile cards, usernames, buttons, and other blockchain-aware components
- Version: 1.104.0

**viem**
- Modern Ethereum library for blockchain interactions
- Used for transactions, smart contract calls, and wallet client management
- Version: 2.21.54

### Network Configuration

```typescript
// LUKSO Networks
const LUKSO_MAINNET = {
  rpc: 'https://rpc.mainnet.lukso.network',
  chainId: 42
};

const LUKSO_TESTNET = {
  rpc: 'https://rpc.testnet.lukso.network',
  chainId: 4201
};

// IPFS Gateway (Development)
const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';

// Envio Indexer URLs
const ENVIO_MAINNET_URL = 'https://envio.lukso-mainnet.universal.tech/v1/graphql';
const ENVIO_TESTNET_URL = 'https://envio.lukso-testnet.universal.tech/v1/graphql';
```

## Universal Profile Development Patterns

### Profile Data Fetching Pattern

```typescript
import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';

const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs/';
const RPC_ENDPOINT = 'https://rpc.testnet.lukso.network';

async function fetchProfileData(address: string) {
  const config = { ipfsGateway: IPFS_GATEWAY };
  const profile = new ERC725(erc725schema, address, RPC_ENDPOINT, config);
  
  try {
    const fetchedData = await profile.fetchData('LSP3Profile');
    
    if (fetchedData?.value && typeof fetchedData.value === 'object' && 'LSP3Profile' in fetchedData.value) {
      const profileData = fetchedData.value.LSP3Profile;
      
      return {
        name: profileData.name,
        description: profileData.description,
        profileImage: profileData.profileImage?.[0]?.url?.replace('ipfs://', IPFS_GATEWAY),
        backgroundImage: profileData.backgroundImage?.[0]?.url?.replace('ipfs://', IPFS_GATEWAY),
        tags: profileData.tags
      };
    }
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return null;
  }
}
```

### Profile Search Integration (Envio)

```typescript
import { request, gql } from 'graphql-request';

const gqlQuery = gql`
  query SearchProfiles($search: String!) {
    search_profiles(args: { search: $search }) {
      name
      fullName
      id
      profileImages(
        where: { error: { _is_null: true } }
        order_by: { width: asc }
      ) {
        width
        src
        url
        verified
      }
    }
  }
`;

async function searchProfiles(searchTerm: string, chainId: number) {
  const envioUrl = chainId === 42 ? ENVIO_MAINNET_URL : ENVIO_TESTNET_URL;
  
  try {
    const { search_profiles: profiles } = await request(
      envioUrl,
      gqlQuery,
      { search: searchTerm }
    );
    
    return profiles.map(profile => ({
      address: profile.id,
      name: profile.name,
      fullName: profile.fullName,
      profileImage: profile.profileImages?.[0]?.src
    }));
  } catch (error) {
    console.error('Profile search error:', error);
    return [];
  }
}
```

## Mini-App Development

### UP Provider Context Setup

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { createClientUPProvider } from '@lukso/up-provider';
import { createWalletClient, createPublicClient, custom } from 'viem';
import { lukso, luksoTestnet } from 'viem/chains';

interface UpProviderContext {
  provider: UPClientProvider | null;
  client: ReturnType<typeof createWalletClient> | null;
  readClient: ReturnType<typeof createPublicClient> | null;
  chainId: number;
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  walletConnected: boolean;
  selectedAddress: `0x${string}` | null;
  setSelectedAddress: (address: `0x${string}` | null) => void;
}

const UpContext = createContext<UpProviderContext | undefined>(undefined);

export function UpProvider({ children }: { children: ReactNode }) {
  const [provider] = useState(() => 
    typeof window !== 'undefined' ? createClientUPProvider() : null
  );
  const [chainId, setChainId] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<`0x${string}` | null>(null);

  const client = useMemo(() => {
    if (!provider || !chainId) return null;
    return createWalletClient({
      chain: chainId === 42 ? lukso : luksoTestnet,
      transport: custom(provider),
    });
  }, [provider, chainId]);

  const readClient = useMemo(() => {
    if (!provider || !chainId) return null;
    return createPublicClient({
      chain: chainId === 42 ? lukso : luksoTestnet,
      transport: custom(provider),
    });
  }, [provider, chainId]);

  useEffect(() => {
    if (!provider) return;

    const init = async () => {
      try {
        const _accounts = await provider.request('eth_accounts', []);
        const _chainId = Number(await provider.request('eth_chainId'));
        const _contextAccounts = provider.contextAccounts;
        
        setAccounts(_accounts);
        setChainId(_chainId);
        setContextAccounts(_contextAccounts);
        setWalletConnected(_accounts[0] != null && _contextAccounts[0] != null);
      } catch (error) {
        console.error('Provider initialization error:', error);
      }
    };

    init();

    // Event listeners
    const accountsChanged = (_accounts: Array<`0x${string}`>) => {
      setAccounts(_accounts);
      setWalletConnected(_accounts[0] != null && contextAccounts[0] != null);
    };

    const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
      setContextAccounts(_accounts);
      setWalletConnected(accounts[0] != null && _accounts[0] != null);
    };

    const chainChanged = (_chainId: number) => setChainId(_chainId);

    provider.on('accountsChanged', accountsChanged);
    provider.on('chainChanged', chainChanged);
    provider.on('contextAccountsChanged', contextAccountsChanged);

    return () => {
      provider.removeListener('accountsChanged', accountsChanged);
      provider.removeListener('contextAccountsChanged', contextAccountsChanged);
      provider.removeListener('chainChanged', chainChanged);
    };
  }, [provider]);

  const value = useMemo(() => ({
    provider,
    client,
    readClient,
    chainId,
    accounts,
    contextAccounts,
    walletConnected,
    selectedAddress,
    setSelectedAddress
  }), [provider, client, readClient, chainId, accounts, contextAccounts, walletConnected, selectedAddress]);

  return <UpContext.Provider value={value}>{children}</UpContext.Provider>;
}

export function useUpProvider() {
  const context = useContext(UpContext);
  if (!context) {
    throw new Error('useUpProvider must be used within a UpProvider');
  }
  return context;
}
```

### Mini-App Component Structure

```typescript
// components/ProfileSearch.tsx
import { useState, useCallback } from 'react';
import { useUpProvider } from './upProvider';

export function ProfileSearch({ onSelectAddress }: { onSelectAddress: (address: `0x${string}`) => void }) {
  const { chainId } = useUpProvider();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const profiles = await searchProfiles(searchQuery, chainId);
      setResults(profiles);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  return (
    <div className="profile-search">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="Search profiles..."
      />
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map((profile) => (
            <button
              key={profile.address}
              onClick={() => onSelectAddress(profile.address)}
              className="profile-result"
            >
              <img src={profile.profileImage} alt={profile.name} />
              <div>
                <div>{profile.fullName || profile.name}</div>
                <div className="address">{profile.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Wallet Connection and Authentication

### UP Browser Extension Integration

```typescript
// Connection flow for UP Browser Extension
async function connectUniversalProfile() {
  try {
    const provider = createClientUPProvider();
    
    // Request account access
    const accounts = await provider.request('eth_requestAccounts', []);
    
    // Get chain information
    const chainId = await provider.request('eth_chainId');
    
    // Get Universal Profile context accounts
    const contextAccounts = provider.contextAccounts;
    
    if (accounts.length > 0 && contextAccounts.length > 0) {
      // Successfully connected
      return {
        address: accounts[0],
        universalProfile: contextAccounts[0],
        chainId: Number(chainId)
      };
    }
  } catch (error) {
    console.error('Connection failed:', error);
    throw new Error('Failed to connect Universal Profile');
  }
}
```

### Wallet State Management

```typescript
// Custom hook for wallet state
function useWalletState() {
  const { 
    walletConnected, 
    accounts, 
    contextAccounts, 
    chainId, 
    client 
  } = useUpProvider();

  const isReady = walletConnected && client && accounts.length > 0;
  
  const walletInfo = {
    isConnected: walletConnected,
    address: accounts[0],
    universalProfile: contextAccounts[0],
    chainId,
    network: chainId === 42 ? 'LUKSO Mainnet' : 'LUKSO Testnet',
    isReady
  };

  return walletInfo;
}
```

## Transaction Patterns

### LYX Transfer Pattern

```typescript
async function transferLYX(
  client: WalletClient,
  to: `0x${string}`,
  amount: string
) {
  try {
    const amountInWei = parseUnits(amount, 18);
    
    const tx = await client.sendTransaction({
      account: client.account,
      to,
      value: amountInWei,
      chain: client.chain,
    });

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(client, { hash: tx });
    
    return {
      success: true,
      transactionHash: tx,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Transaction failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Transaction Status Management

```typescript
function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeTransaction = async (
    transactionFn: () => Promise<any>
  ) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await transactionFn();
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeTransaction,
    isLoading,
    error,
    success
  };
}
```

## Profile and Asset Management

### Digital Asset Metadata Fetching

```typescript
import { ERC725 } from '@erc725/erc725.js';
import lsp4Schema from '@lukso/lsp-smart-contracts/schemas/LSP4DigitalAsset.json';

async function fetchAssetMetadata(assetAddress: string) {
  const config = { ipfsGateway: IPFS_GATEWAY };
  const asset = new ERC725(lsp4Schema, assetAddress, RPC_ENDPOINT, config);
  
  try {
    const metadata = await asset.fetchData('LSP4Metadata');
    
    if (metadata?.value && typeof metadata.value === 'object' && 'LSP4Metadata' in metadata.value) {
      const assetData = metadata.value.LSP4Metadata;
      
      return {
        name: assetData.name,
        description: assetData.description,
        images: assetData.images?.map(img => ({
          width: img.width,
          height: img.height,
          url: img.url.replace('ipfs://', IPFS_GATEWAY)
        })),
        assets: assetData.assets?.map(asset => ({
          ...asset,
          url: asset.url.replace('ipfs://', IPFS_GATEWAY)
        }))
      };
    }
  } catch (error) {
    console.error('Error fetching asset metadata:', error);
    return null;
  }
}
```

### Asset Transfer Pattern

```typescript
async function transferAsset(
  client: WalletClient,
  assetAddress: `0x${string}`,
  to: `0x${string}`,
  amount: bigint,
  tokenId?: string
) {
  try {
    // Determine if it's LSP7 (fungible) or LSP8 (non-fungible)
    const isLSP7 = await readContract(client, {
      address: assetAddress,
      abi: LSP7DigitalAsset.abi,
      functionName: 'supportsInterface',
      args: ['0x5fcaac27'] // LSP7 interface ID
    });

    if (isLSP7) {
      // LSP7 transfer
      const tx = await client.writeContract({
        address: assetAddress,
        abi: LSP7DigitalAsset.abi,
        functionName: 'transfer',
        args: [client.account.address, to, amount, true, '0x']
      });
      return tx;
    } else {
      // LSP8 transfer
      const tx = await client.writeContract({
        address: assetAddress,
        abi: LSP8IdentifiableDigitalAsset.abi,
        functionName: 'transfer',
        args: [client.account.address, to, tokenId, true, '0x']
      });
      return tx;
    }
  } catch (error) {
    console.error('Asset transfer failed:', error);
    throw error;
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// Comprehensive error handling pattern
async function safeBlockchainCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Blockchain operation failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // User-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message.includes('network')) {
        throw new Error('Network connection error');
      }
    }
    
    return fallback;
  }
}
```

### 2. Network Configuration

```typescript
// Centralized network configuration
const NETWORKS = {
  42: {
    name: 'LUKSO Mainnet',
    rpc: 'https://rpc.mainnet.lukso.network',
    explorer: 'https://explorer.execution.mainnet.lukso.network',
    envio: 'https://envio.lukso-mainnet.universal.tech/v1/graphql'
  },
  4201: {
    name: 'LUKSO Testnet',
    rpc: 'https://rpc.testnet.lukso.network',
    explorer: 'https://explorer.execution.testnet.lukso.network',
    envio: 'https://envio.lukso-testnet.universal.tech/v1/graphql'
  }
};

function getNetworkConfig(chainId: number) {
  return NETWORKS[chainId] || NETWORKS[4201]; // Default to testnet
}
```

### 3. IPFS Best Practices

```typescript
// IPFS URL handling
function formatIpfsUrl(ipfsUrl: string, gateway: string = IPFS_GATEWAY): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', gateway);
  }
  if (ipfsUrl.startsWith('/ipfs/')) {
    return gateway + ipfsUrl.slice(6);
  }
  return ipfsUrl;
}

// Fallback image handling
function getImageWithFallback(imageUrl: string, fallbackUrl: string): string {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => resolve(fallbackUrl);
    img.src = imageUrl;
  });
}
```

### 4. Performance Optimization

```typescript
// Debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Memoized expensive operations
const memoizedProfileData = useMemo(() => {
  return processProfileData(rawProfileData);
}, [rawProfileData]);
```

### 5. Security Considerations

```typescript
// Input validation
function validateAddress(address: string): `0x${string}` | null {
  // Basic Ethereum address validation
  if (!address.startsWith('0x') || address.length !== 42) {
    return null;
  }
  
  // Check if it's a valid hex string
  const hexRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!hexRegex.test(address)) {
    return null;
  }
  
  return address as `0x${string}`;
}

// Amount validation
function validateAmount(amount: string, minAmount: number = 0.001): boolean {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > minAmount;
}
```

## Code Examples

### Complete Mini-App Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useUpProvider } from './upProvider';
import { ProfileSearch } from './ProfileSearch';
import { LuksoProfile } from './LuksoProfile';

export function MiniApp() {
  const { walletConnected, selectedAddress, setSelectedAddress } = useUpProvider();
  const [showSearch, setShowSearch] = useState(false);

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Universal Profile</h1>
          <p className="text-gray-600">Please install the UP Browser Extension to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">LUKSO Mini App</h1>
        
        {showSearch ? (
          <ProfileSearch 
            onSelectAddress={(address) => {
              setSelectedAddress(address);
              setShowSearch(false);
            }}
          />
        ) : (
          <div className="space-y-6">
            {selectedAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <LuksoProfile address={selectedAddress} />
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={() => setShowSearch(true)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Search Profiles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Smart Contract Interaction Pattern

```typescript
import { ethers } from 'ethers';
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';

async function interactWithContract() {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contract = new ethers.Contract(
    '0x...', // Contract address
    LSP7DigitalAsset.abi,
    signer
  );
  
  // Read operation
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalSupply = await contract.totalSupply();
  
  console.log({ name, symbol, totalSupply });
  
  // Write operation
  const tx = await contract.transfer(
    '0x...', // from
    '0x...', // to
    1000,    // amount
    true,    // force
    '0x'     // data
  );
  
  await tx.wait();
  console.log('Transfer completed:', tx.hash);
}
```

### Complete Deployment Script

```typescript
import { ethers } from 'ethers';
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';

async function deployToken() {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Deploying with address:', signer.address);
  
  const factory = new ethers.ContractFactory(
    LSP7DigitalAsset.abi,
    LSP7DigitalAsset.bytecode,
    signer
  );
  
  const contract = await factory.deploy(
    'My Token',           // name
    'MTK',                // symbol
    signer.address,       // newOwner
    ethers.parseEther('1000000'), // total supply
    true,                 // isNFT
    '0x'                  // data
  );
  
  await contract.waitForDeployment();
  
  console.log('Contract deployed to:', contract.target);
  console.log('Transaction hash:', contract.deploymentTransaction()?.hash);
}
```

This comprehensive guide provides the foundation for building robust LUKSO applications with proper patterns, error handling, and best practices. The examples demonstrate real-world usage scenarios that can be adapted for various dApp requirements.

## Additional Resources

- [LUKSO Technical Documentation](https://docs.lukso.tech/)
- [LSP Standards Overview](https://docs.lukso.tech/standards/introduction/)
- [Universal Profile Documentation](https://docs.lukso.tech/standards/accounts/introduction/)
- [LUKSO Playground Repository](https://github.com/lukso-network/lukso-playground)
- [Mini-App Next.js Template](https://github.com/lukso-network/miniapp-nextjs-template)

## Version Information

- Node.js: 18+ recommended
- Package Manager: Bun (preferred) or npm/yarn
- TypeScript: 5.x
- React: 19.x (for mini-apps)
- Next.js: 15.x (for mini-apps)