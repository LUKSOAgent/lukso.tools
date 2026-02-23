export type ToolCategory = 
  | "all"
  | "indexer"
  | "token"
  | "authorization"
  | "grid"
  | "migration"
  | "developer"
  | "analytics"
  | "social";

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: Exclude<ToolCategory, "all">;
  githubUrl?: string;
  tags?: string[];
  author?: string;
}

export const categories: { id: ToolCategory; label: string; description: string }[] = [
  { id: "all", label: "All", description: "All tools in the ecosystem" },
  { id: "indexer", label: "Indexer", description: "Blockchain data indexing and querying" },
  { id: "token", label: "Token", description: "Token drops, claims, and management" },
  { id: "authorization", label: "Authorization", description: "Permission and key management" },
  { id: "grid", label: "Grid", description: "Universal Profile grid layouts and templates" },
  { id: "migration", label: "Migration", description: "Asset migration and transfer tools" },
  { id: "developer", label: "Developer", description: "SDKs and developer tools" },
  { id: "analytics", label: "Analytics", description: "Explorers and dashboards" },
  { id: "social", label: "Social", description: "Social features and community tools" },
];

export const tools: Tool[] = [
  {
    id: "lsp-indexer",
    name: "LSP Indexer",
    description: "Open-source indexer listening to LUKSO blockchain events. Decodes LSP3 profile metadata, LSP4 asset metadata, and LSP6 permission sets for fast queries.",
    url: "https://github.com/chillwhales/lsp-indexer",
    category: "indexer",
    githubUrl: "https://github.com/chillwhales/lsp-indexer",
    tags: ["indexer", "lsp3", "lsp4", "lsp6", "metadata", "events"],
    author: "chillwhales"
  },
  {
    id: "envio-lukso",
    name: "Envio LUKSO Mainnet",
    description: "High-performance GraphQL indexing endpoint for LUKSO mainnet. Query blocks, transactions, events, and decoded LSP data with sub-100ms response times.",
    url: "https://envio.lukso-mainnet.universal.tech",
    category: "indexer",
    githubUrl: "https://github.com/enviodev",
    tags: ["graphql", "indexer", "api", "mainnet", "query"],
    author: "Envio"
  },
  {
    id: "agent-token-claimer",
    name: "Agent Token Claimer",
    description: "Beta application for discovering and claiming token and NFT drops on LUKSO. Browse active drops, view details, and claim directly to your Universal Profile.",
    url: "https://agent-token-claimer.vercel.app",
    category: "token",
    githubUrl: "https://github.com/JordyDutch/Token-Claimer",
    tags: ["drop", "claim", "token", "nft", "lsp7", "lsp8"],
    author: "JordyDutch"
  },
  {
    id: "up-authorize",
    name: "Universal Profile Authorize",
    description: "LSP6 Key Manager permission management interface. Grant, revoke, and configure permissions for controllers of your Universal Profile with an intuitive UI.",
    url: "https://authorize.universalprofile.cloud",
    category: "authorization",
    tags: ["lsp6", "permissions", "key-manager", "controller", "security"],
    author: "LUKSO"
  },
  {
    id: "grid-store",
    name: "GridStore",
    description: "Template marketplace for Universal Profile grid layouts (LSP28). Browse, preview, and install pre-built grid configurations to customize your profile's appearance.",
    url: "https://grid-store-lukso.vercel.app",
    category: "grid",
    tags: ["lsp28", "grid", "templates", "profile", "customization"],
    author: "Community"
  },
  {
    id: "lsp-mover",
    name: "LSP Asset Mover",
    description: "Migration tool to transfer LSP7 and LSP8 assets from legacy EOAs to Universal Profiles. Bulk transfer support with transaction batching.",
    url: "https://lsp-mover.sigmacore.io",
    category: "migration",
    tags: ["migration", "lsp7", "lsp8", "transfer", "bulk", "eoa"],
    author: "SigmaCore"
  }
];
