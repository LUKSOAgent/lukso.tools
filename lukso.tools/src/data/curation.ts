import { tools, type Tool } from "@/data/tools";

export type ToolProfile = {
  toolId: string;
  upAddress: string;
  maintainer: string;
  maintainerUp: string;
  claimed: boolean;
  likesReceived: number;
  uniqueLikers: number;
  lastUpdated: string;
  standards: string[];
};

export type CuratedList = {
  id: string;
  name: string;
  description: string;
  curator: string;
  curatorUp: string;
  listUpAddress: string;
  hashListAddress: string;
  likesReceived: number;
  uniqueLikers: number;
  tags: string[];
  toolIds: string[];
};

export type ToolWithSignals = Tool & {
  profile: ToolProfile | undefined;
  curatedBy: CuratedList[];
  score: number;
};

export const toolProfiles: ToolProfile[] = [
  {
    toolId: "stakingverse",
    upAddress: "0x1111111111111111111111111111111111111001",
    maintainer: "Stakingverse",
    maintainerUp: "0x1111111111111111111111111111111111110001",
    claimed: true,
    likesReceived: 42800,
    uniqueLikers: 184,
    lastUpdated: "2026-06-08",
    standards: ["LSP0", "LSP7"],
  },
  {
    toolId: "universalswaps",
    upAddress: "0x1111111111111111111111111111111111111002",
    maintainer: "UniversalSwaps",
    maintainerUp: "0x1111111111111111111111111111111111110002",
    claimed: true,
    likesReceived: 36900,
    uniqueLikers: 151,
    lastUpdated: "2026-06-08",
    standards: ["LSP0", "LSP7", "LSP8"],
  },
  {
    toolId: "universal-page",
    upAddress: "0x1111111111111111111111111111111111111003",
    maintainer: "Universal Page",
    maintainerUp: "0x1111111111111111111111111111111111110003",
    claimed: true,
    likesReceived: 51200,
    uniqueLikers: 214,
    lastUpdated: "2026-06-08",
    standards: ["LSP0", "LSP8"],
  },
  {
    toolId: "envio-lukso",
    upAddress: "0x1111111111111111111111111111111111111004",
    maintainer: "Envio",
    maintainerUp: "0x1111111111111111111111111111111111110004",
    claimed: true,
    likesReceived: 18400,
    uniqueLikers: 94,
    lastUpdated: "2026-06-08",
    standards: ["GraphQL", "LSP0"],
  },
  {
    toolId: "erc725-inspect",
    upAddress: "0x1111111111111111111111111111111111111005",
    maintainer: "LUKSO",
    maintainerUp: "0x1111111111111111111111111111111111110005",
    claimed: true,
    likesReceived: 14600,
    uniqueLikers: 72,
    lastUpdated: "2026-06-08",
    standards: ["ERC725", "LSP2"],
  },
  {
    toolId: "grid-store",
    upAddress: "0x1111111111111111111111111111111111111006",
    maintainer: "GridStore",
    maintainerUp: "0x1111111111111111111111111111111111110006",
    claimed: true,
    likesReceived: 9200,
    uniqueLikers: 53,
    lastUpdated: "2026-06-08",
    standards: ["LSP0", "LSP28"],
  },
  {
    toolId: "forever-moments",
    upAddress: "0x1111111111111111111111111111111111111007",
    maintainer: "Forever Moments",
    maintainerUp: "0x1111111111111111111111111111111111110007",
    claimed: true,
    likesReceived: 73100,
    uniqueLikers: 238,
    lastUpdated: "2026-06-08",
    standards: ["LSP0", "LSP7", "LSP8"],
  },
  {
    toolId: "agent-skills-hub",
    upAddress: "0x1111111111111111111111111111111111111008",
    maintainer: "JordyDutch",
    maintainerUp: "0x1111111111111111111111111111111111110008",
    claimed: true,
    likesReceived: 12100,
    uniqueLikers: 41,
    lastUpdated: "2026-06-08",
    standards: ["OpenClaw", "LSP0"],
  },
];

export const curatedLists: CuratedList[] = [
  {
    id: "jordy-dev-essentials",
    name: "Jordy's Developer Essentials",
    description: "Practical tools for building, debugging, and shipping on LUKSO.",
    curator: "JordyDutch",
    curatorUp: "0x2222222222222222222222222222222222220001",
    listUpAddress: "0x2222222222222222222222222222222222221001",
    hashListAddress: "0x2222222222222222222222222222222222222001",
    likesReceived: 28600,
    uniqueLikers: 93,
    tags: ["developer", "debugging", "essentials"],
    toolIds: ["erc725-inspect", "envio-lukso", "lukso-docs", "lsp-indexer", "up-provider"],
  },
  {
    id: "lukso-defi-live",
    name: "Live DeFi Tools",
    description: "Active DeFi and token tools that are useful for day-to-day LUKSO activity.",
    curator: "LUKSO community",
    curatorUp: "0x2222222222222222222222222222222222220002",
    listUpAddress: "0x2222222222222222222222222222222222221002",
    hashListAddress: "0x2222222222222222222222222222222222222002",
    likesReceived: 22400,
    uniqueLikers: 88,
    tags: ["defi", "staking", "swap"],
    toolIds: ["stakingverse", "universalswaps", "stakingverse-network-stats", "potato-tipper"],
  },
  {
    id: "grid-and-social",
    name: "Grid and Social Layer",
    description: "Tools that show what Universal Profiles can become as public identities.",
    curator: "Community curators",
    curatorUp: "0x2222222222222222222222222222222222220003",
    listUpAddress: "0x2222222222222222222222222222222222221003",
    hashListAddress: "0x2222222222222222222222222222222222222003",
    likesReceived: 34600,
    uniqueLikers: 117,
    tags: ["social", "grid", "identity"],
    toolIds: ["grid-store", "lukso-grid-guide", "forever-moments", "universal-everything", "common-ground"],
  },
];

export function adjustedLikes(likes: number, uniqueLikers: number) {
  return Math.round(Math.sqrt(likes) * 10 + uniqueLikers * 2);
}

export function getToolProfile(toolId: string) {
  return toolProfiles.find((profile) => profile.toolId === toolId);
}

export function getCuratedListsForTool(toolId: string) {
  return curatedLists.filter((list) => list.toolIds.includes(toolId));
}

export function getToolsWithSignals() {
  return tools.map((tool) => {
    const profile = getToolProfile(tool.id);
    const lists = getCuratedListsForTool(tool.id);
    const likes = profile ? adjustedLikes(profile.likesReceived, profile.uniqueLikers) : 0;
    const curatedWeight = lists.length * 1000;
    const claimedWeight = profile?.claimed ? 250 : 0;

    return {
      ...tool,
      profile,
      curatedBy: lists,
      score: curatedWeight + claimedWeight + likes,
    };
  }) satisfies ToolWithSignals[];
}

export function getCuratedToolIds() {
  return new Set(curatedLists.flatMap((list) => list.toolIds));
}

export function getToolsForList(list: CuratedList) {
  const byId = new Map(getToolsWithSignals().map((tool) => [tool.id, tool]));
  return list.toolIds
    .map((id) => byId.get(id))
    .filter((tool): tool is ToolWithSignals => Boolean(tool));
}
