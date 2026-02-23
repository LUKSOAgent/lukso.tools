# Contributing to lukso.tools

Thank you for your interest in contributing to lukso.tools! This guide will help you add your tool to the directory.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your changes
4. Follow the guidelines below
5. Submit a pull request

## Tool Data Format

Tools are defined in `src/data/tools.ts`. Each tool follows this structure:

```typescript
{
  id: "unique-tool-identifier",     // Required: URL-friendly unique ID
  name: "Tool Name",                 // Required: Display name
  description: "What this tool does", // Required: Max 160 characters
  url: "https://example.com",        // Required: Tool URL
  category: "defi",                  // Required: See categories below
  githubUrl: "https://github.com/...", // Optional: Repository URL
  tags: ["tag1", "tag2"],            // Optional: Array of tags
  author: "Author Name"              // Optional: Creator/team name
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier, lowercase, hyphen-separated (e.g., `universal-swaps`) |
| `name` | `string` | Display name (max 50 characters) |
| `description` | `string` | Short description (max 160 characters) |
| `url` | `string` | HTTPS URL to the tool |
| `category` | `string` | One of the supported categories |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `githubUrl` | `string` | Link to GitHub repository |
| `tags` | `string[]` | Up to 5 relevant tags (lowercase, hyphenated) |
| `author` | `string` | Tool creator or team name |

### Supported Categories

| Category | Description | Example Tools |
|----------|-------------|---------------|
| `defi` | DeFi protocols and dApps | DEXes, lending, yield farming |
| `nft` | NFT and collection tools | Marketplaces, minting platforms |
| `wallet` | Wallets and key management | Browser wallets, mobile apps |
| `developer` | Developer tools | SDKs, libraries, dev utilities |
| `infrastructure` | Infrastructure services | RPC nodes, indexers, bridges |
| `analytics` | Analytics and data | Explorers, dashboards |
| `community` | Community tools | Forums, social, governance |

### Example Tool Entry

```typescript
{
  id: "universal-swaps",
  name: "Universal Swaps",
  description: "DEX for swapping tokens on LUKSO with Universal Profile integration",
  url: "https://universal.page/swap",
  category: "defi",
  githubUrl: "https://github.com/lukso-network/universal-swaps",
  tags: ["dex", "swap", "lsp7", "lsp8"],
  author: "LUKSO"
}
```

## Step-by-Step Guide

### 1. Fork and Clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/lukso.tools.git
cd lukso.tools
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Your Tool

Edit `src/data/tools.ts` and add your tool to the `tools` array:

```typescript
export const tools: Tool[] = [
  // ... existing tools
  
  {
    id: "your-tool-id",
    name: "Your Tool Name",
    description: "Description of your tool",
    url: "https://your-tool.com",
    category: "defi",
    githubUrl: "https://github.com/you/tool",
    tags: ["defi", "tool"],
    author: "Your Name"
  },
];
```

### 4. Test Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and verify:
- Your tool appears in the list
- Search finds your tool
- Category filters work
- All links are correct

### 5. Build Check

Ensure the project builds without errors:

```bash
npm run build
```

### 6. Submit Pull Request

1. Commit your changes:
   ```bash
   git add src/data/tools.ts
   git commit -m "Add [tool-name] to directory"
   ```

2. Push to your fork:
   ```bash
   git push origin main
   ```

3. Open a Pull Request on GitHub
4. Fill out the PR template completely

## Guidelines

### Tool Requirements

- Tool must be functional and accessible
- URL must use HTTPS
- Tool should be relevant to the LUKSO ecosystem
- No malicious or scam projects
- No duplicate entries

### Description Guidelines

- Keep it under 160 characters
- Focus on what the tool does
- Avoid marketing fluff
- Include "LUKSO" or relevant standards (LSP7, LSP8, UP) if applicable

### Tag Guidelines

- Use lowercase, hyphen-separated tags
- Maximum 5 tags per tool
- Use relevant, specific tags
- Common tags: `defi`, `nft`, `wallet`, `lsp7`, `lsp8`, `staking`, `bridge`, `dex`

### Review Process

- All submissions are reviewed manually
- We check for functionality and relevance
- Changes may be requested
- Approval typically takes 1-3 days

## Questions?

- Open an issue for questions
- Join the LUKSO Discord for discussion
- Check existing tools for examples

## Code of Conduct

- Be respectful and constructive
- No spam or promotional content
- Help others in the community

Thank you for contributing to the LUKSO ecosystem!
