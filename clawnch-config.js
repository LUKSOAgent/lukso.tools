// Clawnch token launcher for Base
// Uses Moltbook for !clawnch posts

const CLAWNCH_CONFIG = {
  token: '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be', // $CLAWNCH
  burnAddress: '0x000000000000000000000000000000000000dEaD',
  wallet: '0x899C7642802E294857b19754a2377F8e74dA9319',
  platforms: {
    moltbook: 'https://www.moltbook.com/m/clawnch'
  }
};

// Template for token launch post
function generateLaunchPost(name, symbol, description, imageUrl, website, twitter) {
  return `!clawnch
name: ${name}
symbol: ${symbol}
wallet: ${CLAWNCH_CONFIG.wallet}
description: ${description}
image: ${imageUrl}
website: ${website}
twitter: ${twitter}`;
}

module.exports = { CLAWNCH_CONFIG, generateLaunchPost };
