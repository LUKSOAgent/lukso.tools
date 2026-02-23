// LSP26 Follower System ABI
export const LSP26_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "follower", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "followee", "type": "address" }
    ],
    "name": "Follow",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "follower", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "followee", "type": "address" }
    ],
    "name": "Unfollow",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "address", "name": "followee", "type": "address" }],
    "name": "follow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "follower", "type": "address" }],
    "name": "getFollowers",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "followee", "type": "address" }],
    "name": "getFollows",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "follower", "type": "address" },
      { "internalType": "address", "name": "followee", "type": "address" }
    ],
    "name": "isFollowing",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "followee", "type": "address" }],
    "name": "unfollow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// LSP7 Digital Asset ABI (for reputation tokens)
export const LSP7_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "force", "type": "bool" },
      { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "address", "name": "tokenOwner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export const LSP26_CONTRACT_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
export const REPUTATION_TOKEN_ADDRESS = '0x98b35B543806a1542fcF63883b2AaE224e3Bc66E';
