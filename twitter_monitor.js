#!/usr/bin/env node
const { TwitterApi } = require('twitter-api-v2');
const { ethers } = require('ethers');
const fs = require('fs');

// Twitter credentials
const twitterClient = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

// LUKSO setup
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const LSP26_CONTRACT = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

const LSP6_ABI = ["function execute(bytes calldata payload) external payable returns (bytes memory)"];
const LSP0_ABI = ["function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)"];
const LSP26_ABI = ["function follow(address addr) external"];

// Track processed tweets
const PROCESSED_FILE = '/root/.openclaw/workspace/.twitter_processed.json';
let processedTweets = new Set();

function loadProcessed() {
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
      processedTweets = new Set(data);
    }
  } catch (e) {
    console.error('Error loading processed tweets:', e.message);
  }
}

function saveProcessed() {
  try {
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...processedTweets]));
  } catch (e) {
    console.error('Error saving processed tweets:', e.message);
  }
}

// Extract UP address from text
function extractUPAddress(text) {
  const regex = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(regex);
  if (!matches) return null;
  
  // Validate Ethereum address format
  for (const addr of matches) {
    if (ethers.isAddress(addr)) {
      return addr;
    }
  }
  return null;
}

// Follow on LUKSO
async function followOnLukso(upAddress) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const lsp26Iface = new ethers.Interface(LSP26_ABI);
  const followCalldata = lsp26Iface.encodeFunctionData("follow", [upAddress]);
  
  const lsp0Iface = new ethers.Interface(LSP0_ABI);
  const upExecutePayload = lsp0Iface.encodeFunctionData("execute", [
    0, LSP26_CONTRACT, 0, followCalldata
  ]);
  
  const keyManagerContract = new ethers.Contract(KEY_MANAGER, LSP6_ABI, signer);
  const tx = await keyManagerContract.execute(upExecutePayload, { gasLimit: 300000 });
  
  const receipt = await tx.wait();
  return receipt.status === 1 ? tx.hash : null;
}

// Monitor mentions
async function checkMentions() {
  try {
    const me = await twitterClient.v2.me();
    const myId = me.data.id;
    
    // Get recent mentions
    const mentions = await twitterClient.v2.userMentionTimeline(myId, {
      max_results: 10,
      'tweet.fields': 'created_at,author_id'
    });
    
    for (const tweet of mentions.data?.data || []) {
      if (processedTweets.has(tweet.id)) continue;
      
      console.log(`\\n📬 New mention from ${tweet.author_id}:`);
      console.log(`   "${tweet.text}"`);
      
      const upAddress = extractUPAddress(tweet.text);
      
      if (upAddress) {
        console.log(`✅ Found UP address: ${upAddress}`);
        
        try {
          const txHash = await followOnLukso(upAddress);
          if (txHash) {
            console.log(`🦞 Followed on LUKSO! Tx: ${txHash}`);
            
            // Reply on Twitter
            await twitterClient.v2.tweet({
              text: `✅ Followed you on LUKSO!\\n\\nTx: https://explorer.execution.mainnet.lukso.network/tx/${txHash}`,
              reply: { in_reply_to_tweet_id: tweet.id }
            });
            
            console.log(`🐦 Replied on Twitter`);
          }
        } catch (e) {
          console.error(`❌ Error following ${upAddress}:`, e.message);
        }
      } else {
        console.log(`⚠️  No valid UP address found`);
      }
      
      processedTweets.add(tweet.id);
      saveProcessed();
    }
  } catch (e) {
    console.error('Error checking mentions:', e.message);
  }
}

// Main loop
async function main() {
  console.log('🤖 Twitter → LUKSO Follow Bot started');
  console.log('Monitoring mentions for UP addresses...');
  
  loadProcessed();
  
  // Check every 2 minutes
  setInterval(checkMentions, 2 * 60 * 1000);
  
  // Check immediately on start
  checkMentions();
}

main().catch(console.error);
