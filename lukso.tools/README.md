# lukso.tools

> A curated directory of tools, dApps, and resources for the LUKSO ecosystem.

[![Website](https://img.shields.io/badge/website-lukso.tools-FF2975?style=flat-square)](https://lukso.tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## What is lukso.tools?

**lukso.tools** is a community-driven directory that helps developers and users discover the best tools, dApps, and resources in the LUKSO ecosystem. Whether you're building Universal Profiles, creating LSP-based assets, or exploring DeFi on LUKSO, this is your starting point.

## Features

- **Comprehensive Search** - Find tools quickly with instant search
- **Category Filtering** - Browse by categories like DeFi, NFT, Developer Tools, Wallets, and more
- **HashList Curation** - Discover curated Tool UPs and list detail pages
- **Universal Profile Signals** - Tool UP metadata can be read live from ERC725Y/LSP3
- **LIKES Support** - Send LSP7 LIKES to Tool UPs and List UPs
- **Open Source** - Free to use, fork, and contribute to

## Live LUKSO Configuration

The app ships with static demo data, then upgrades to live LUKSO reads and writes when addresses are configured.

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_LUKSO_RPC_URL=https://rpc.mainnet.lukso.network
NEXT_PUBLIC_LIKES_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CURATED_LISTS='[{"id":"jordy-dev-essentials","hashListAddress":"0x...","listUpAddress":"0x..."}]'
NEXT_PUBLIC_TOOL_PROFILES='[{"toolId":"stakingverse","upAddress":"0x..."}]'
```

Live behavior:

- HashList reads use LSP8 `totalSupply()` and `tokenAt(index)`.
- HashList writes mint the padded Tool UP address as the LSP8 token id.
- Tool UP profile reads use ERC725Y/LSP3 profile metadata.
- LIKES reads use LSP7 `balanceOf(address)`.
- LIKES sends use LSP7 `transfer(from, to, amount, force, data)`.

Placeholder addresses are ignored, so the UI will not submit fake transactions by accident.

## How to Use

### Search
Type in the search bar to find tools by name, description, or tags. Results update instantly as you type.

### Browse Categories
Click on category pills to filter tools by type:
- DeFi
- NFT & Collections
- Wallets
- Developer Tools
- Infrastructure
- Analytics
- Community

### Tool Cards
Each tool card displays:
- Tool name and description
- Category badge
- Tags for quick context
- Direct link to the tool
- GitHub link (if available)

## Contributing

We welcome contributions from the community! To add your tool to lukso.tools:

### Quick Start

1. **Fork this repository**
   ```bash
   git clone https://github.com/your-username/lukso.tools.git
   cd lukso.tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your tool** to `src/data/tools.ts`
   ```typescript
   {
     id: "your-tool-name",
     name: "Your Tool Name",
     description: "A brief description of what your tool does",
     url: "https://your-tool-url.com",
     category: "defi",  // or: nft, wallet, developer, infrastructure, analytics, community
     githubUrl: "https://github.com/your-username/your-tool",  // optional
     tags: ["defi", "staking", "lsp7"],  // optional
     author: "Your Name"  // optional
   }
   ```

4. **Test locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see your changes.

5. **Submit a Pull Request**
   - Push your changes to your fork
   - Open a PR against the main branch
   - Fill out the PR template with details about your tool

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components
- **[viem](https://viem.sh/)** - Contract reads, ABI encoding, and wallet transaction payloads
- **[erc725.js](https://docs.lukso.tech/tools/dapps/erc725js/getting-started/)** - Universal Profile metadata reads

## Project Structure

```
lukso.tools/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page with search & filters
│   │   ├── layout.tsx        # Root layout with metadata
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── tool-card.tsx     # Individual tool display
│   │   ├── tool-grid.tsx     # Grid layout for tools
│   │   ├── search-bar.tsx    # Search input component
│   │   ├── category-filter.tsx # Category pills
│   │   ├── footer.tsx        # Footer with links
│   │   └── ui/               # shadcn/ui components
│   ├── data/
│   │   └── tools.ts          # Tool definitions
│   └── lib/
│       └── utils.ts          # Utility functions
├── public/                   # Static assets
├── README.md
├── CONTRIBUTING.md
└── package.json
```

## Categories

| Category | Description |
|----------|-------------|
| `defi` | Decentralized finance protocols, DEXes, lending, staking |
| `nft` | NFT marketplaces, collection tools, minting platforms |
| `wallet` | Browser extensions, mobile wallets, key managers |
| `developer` | SDKs, dev tools, testing frameworks, libraries |
| `infrastructure` | RPC providers, indexers, oracles, bridges |
| `analytics` | Explorers, dashboards, data providers |
| `community` | Social tools, governance, forums |

## License

[MIT](https://opensource.org/licenses/MIT) - feel free to use this project for your own directory or tool listing site.

## Acknowledgments

- Built for the [LUKSO](https://lukso.network/) ecosystem
- UI components powered by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Want to add your tool?** [Read the contributing guide](./CONTRIBUTING.md) and submit a PR!
