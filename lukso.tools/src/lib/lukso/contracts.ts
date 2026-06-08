import { ERC725 } from "@erc725/erc725.js";
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import {
  createPublicClient,
  custom,
  encodeFunctionData,
  formatUnits,
  getAddress,
  http,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { defineChain } from "viem";
import { LUKSO_CHAIN_ID, LUKSO_IPFS_GATEWAY, LUKSO_RPC_URL } from "@/lib/lukso/config";

export const luksoMainnet = defineChain({
  id: LUKSO_CHAIN_ID,
  name: "LUKSO Mainnet",
  nativeCurrency: { decimals: 18, name: "LYX", symbol: "LYX" },
  rpcUrls: {
    default: { http: [LUKSO_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "LUKSO Blockscout",
      url: "https://explorer.execution.mainnet.lukso.network",
    },
  },
});

export const publicClient = createPublicClient({
  chain: luksoMainnet,
  transport: http(LUKSO_RPC_URL),
});

export const lsp7Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "tokenOwner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "decimals", type: "uint8" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "force", type: "bool" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const lsp8EnumerableAbi = [
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "supply", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenAt",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "tokenOwnerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "bytes32" }],
    outputs: [{ name: "owner", type: "address" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "bytes32" },
      { name: "force", type: "bool" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    lukso?: Eip1193Provider;
  }
}

export function getInjectedProvider() {
  if (typeof window === "undefined") return undefined;
  return window.lukso || window.ethereum;
}

export function addressToTokenId(address: string): Hex {
  return `0x000000000000000000000000${address.replace(/^0x/i, "").toLowerCase()}` as Hex;
}

export function tokenIdToAddress(tokenId: Hex): Address {
  return getAddress(`0x${tokenId.slice(-40)}`);
}

export async function readHashListEntries(hashListAddress: string) {
  const address = getAddress(hashListAddress);
  const totalSupply = await publicClient.readContract({
    address,
    abi: lsp8EnumerableAbi,
    functionName: "totalSupply",
  });

  const entries = await Promise.all(
    Array.from({ length: Number(totalSupply) }, (_, index) =>
      publicClient.readContract({
        address,
        abi: lsp8EnumerableAbi,
        functionName: "tokenAt",
        args: [BigInt(index)],
      }),
    ),
  );

  return entries.map((tokenId) => tokenIdToAddress(tokenId));
}

export async function isHashListEntry(hashListAddress: string, targetAddress: string) {
  try {
    await publicClient.readContract({
      address: getAddress(hashListAddress),
      abi: lsp8EnumerableAbi,
      functionName: "tokenOwnerOf",
      args: [addressToTokenId(targetAddress)],
    });
    return true;
  } catch {
    return false;
  }
}

export async function readLikesBalance(tokenAddress: string, targetAddress: string, decimals = 18) {
  const balance = await publicClient.readContract({
    address: getAddress(tokenAddress),
    abi: lsp7Abi,
    functionName: "balanceOf",
    args: [getAddress(targetAddress)],
  });

  return Number(formatUnits(balance, decimals));
}

export async function readLsp7Decimals(tokenAddress: string) {
  try {
    return await publicClient.readContract({
      address: getAddress(tokenAddress),
      abi: lsp7Abi,
      functionName: "decimals",
    });
  } catch {
    return 18;
  }
}

export async function readLsp3Profile(upAddress: string) {
  const erc725 = new ERC725(lsp3ProfileSchema, upAddress, LUKSO_RPC_URL, {
    ipfsGateway: LUKSO_IPFS_GATEWAY,
  });

  const data = await erc725.fetchData("LSP3Profile");
  return data.value;
}

export async function sendLikesTransfer(
  provider: Eip1193Provider,
  tokenAddress: string,
  from: string,
  to: string,
  amount: string,
  decimals: number,
) {
  const data = encodeFunctionData({
    abi: lsp7Abi,
    functionName: "transfer",
    args: [getAddress(from), getAddress(to), parseUnits(amount, decimals), true, "0x"],
  });

  return provider.request({
    method: "eth_sendTransaction",
    params: [{ from: getAddress(from), to: getAddress(tokenAddress), data }],
  }) as Promise<Hex>;
}

export async function mintHashListEntry(
  provider: Eip1193Provider,
  from: string,
  hashListAddress: string,
  toolUpAddress: string,
) {
  const tokenId = addressToTokenId(toolUpAddress);
  const data = encodeFunctionData({
    abi: lsp8EnumerableAbi,
    functionName: "mint",
    args: [getAddress(toolUpAddress), tokenId, true, "0x"],
  });

  return provider.request({
    method: "eth_sendTransaction",
    params: [{ from: getAddress(from), to: getAddress(hashListAddress), data }],
  }) as Promise<Hex>;
}

export function createWalletClient(provider: Eip1193Provider) {
  return createPublicClient({
    chain: luksoMainnet,
    transport: custom(provider),
  });
}
