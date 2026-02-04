#!/usr/bin/env node
const { TwitterApi } = require('twitter-api-v2');
const { ethers } = require('ethers');
const fs = require('fs');

// Twitter setup
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

const POTATO_CONTRACT = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';
const POTATO_AMOUNT = ethers.parseUnits('1', 18); // 1 potato

const LSP6_ABI = ["function execute(bytes calldata payload) external payable returns (bytes memory)"];
const LSP0_ABI = ["function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)"];
const LSP26_ABI = ["function follow(address addr) external"];
const LSP7_ABI = ["function transfer(address from, address to, uint256 amount, bool force, bytes data) external"];

// Track processed
const PROCESSED_FILE = '/root/.openclaw/workspace/.twitter_processed.json';
let processedTweets = new Set();

function loadProcessed() {
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      processedTweets = new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')));
    }
  } catch (e) {
    console.error('Error loading:', e.message);
  }
}

function saveProcessed() {
  try {
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...processedTweets]));
  } catch (e) {
    console.error('Error saving:', e.message);
  }
}

function extractUPAddress(text) {
  const regex = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(regex);
  if (!matches) return null;
  for (const addr of matches) {
    if (ethers.isAddress(addr)) return addr;
  }
  return null;
}

async function followAndSendPotato(upAddress) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
  
  // Encode follow call
  const lsp26Iface = new ethers.Interface(LSP26_ABI);
  const followCalldata = lsp26Iface.encodeFunctionData("follow", [upAddress]);
  
  // Encode potato transfer
  const lsp7Iface = new ethers.Interface(LSP7_ABI);
  const potatoCalldata = lsp7Iface.encodeFunctionData("transfer", [
    MY_UP, upAddress, POTATO_AMOUNT, false, "0x"
  ]);
  
  // Batch both operations via executeBatch
  const lsp0Iface = new ethers.Interface(LSP0_ABI);
  const executePayloads = [
    lsp0Iface.encodeFunctionData("execute", [0, LSP26_CONTRACT, 0, followCalldata]),
    lsp0Iface.encodeFunctionData("execute", [0, POTATO_CONTRACT, 0, potatoCalldata])
  ];
  
  // Execute via batchCalls on UP
  const batchCallsIface = new ethers.Interface([
    "function batchCalls(bytes[] data) external returns (bytes[] results)"
  ]);
  const batchPayload = batchCallsIface.encodeFunctionData("batchCalls", [executePayloads]);
  
  const keyManagerContract = new ethers.Contract(KEY_MANAGER, LSP6_ABI, signer);
  const tx = await keyManagerContract.execute(batchPayload, { gasLimit: 500000 });
  const receipt = await tx.wait();
  return receipt.status === 1 ? tx.hash : null;
}

async function checkReplies() {
  try {
    const TARGET_TWEET = '2018831752056410575';
    const MY_USER_ID = '2018833059030700032'; // LUKSOAgent
    
    // Get conversation thread
    const search = await twitterClient.v2.search({
      query: `conversation_id:${TARGET_TWEET}`,
      max_results: 100,
      'tweet.fields': 'created_at,author_id,conversation_id'
    });
    
    if (!search.data?.data) {
      console.log('No replies found');
      return;
    }
    
    console.log(`\n📬 Found ${search.data.data.length} replies`);
    
    for (const tweet of search.data.data) {
      if (processedTweets.has(tweet.id)) continue;
      if (tweet.id === TARGET_TWEET) continue; // Skip original
      if (tweet.author_id === MY_USER_ID) {
        console.log(`⏭️  Skipping my own tweet ${tweet.id}`);
        processedTweets.add(tweet.id);
        saveProcessed();
        continue;
      }
      
      console.log(`\n🔍 Processing tweet ${tweet.id}:`);
      console.log(`   "${tweet.text}"`);
      
      const upAddress = extractUPAddress(tweet.text);
      
      if (upAddress) {
        console.log(`✅ Found UP: ${upAddress}`);
        
        try {
          const txHash = await followAndSendPotato(upAddress);
          if (txHash) {
            console.log(`🦞 Followed + sent 1 potato! Tx: ${txHash}`);
            
            await twitterClient.v2.tweet({
              text: `✅ Followed you on LUKSO!\n🥔 Sent you 1 potato!\n\nTx: https://explorer.execution.mainnet.lukso.network/tx/${txHash}\n\n🦞 Welcome to the network!`,
              reply: { in_reply_to_tweet_id: tweet.id }
            });
            
            console.log(`🐦 Replied on Twitter`);
          }
        } catch (e) {
          console.error(`❌ Error: ${e.message}`);
        }
      } else {
        console.log(`ℹ️  No UP address - sending general reply`);
        
        try {
          await twitterClient.v2.tweet({
            text: `Hey! 👋\n\nTo connect on LUKSO, reply with your Universal Profile address (0x...)!\n\nMy UP: 0x293E96ebbf264ed7715cff2b67850517De70232a\n\n🦞`,
            reply: { in_reply_to_tweet_id: tweet.id }
          });
          console.log(`🐦 Sent general reply`);
        } catch (e) {
          console.error(`❌ Reply error: ${e.message}`);
        }
      }
      
      processedTweets.add(tweet.id);
      saveProcessed();
    }
  } catch (e) {
    console.error('Error checking replies:', e.message);
  }
}

async function main() {
  console.log('🤖 Twitter Reply Monitor Started');
  console.log('Monitoring: https://x.com/JordyDutch/status/2018831752056410575');
  console.log('Checking every 2 minutes...\n');
  
  loadProcessed();
  
  // Check every 2 minutes
  setInterval(checkReplies, 2 * 60 * 1000);
  
  // Check now
  checkReplies();
}

main().catch(console.error);
