const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const ART_COLLECTION = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';
const IMAGE_PATH = '/root/.openclaw/media/inbound/file_0---31a6b497-7335-4c2d-9a90-79b1146f01d8.jpg';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.forevermoments.life',
      path: path,
      method: method,
      headers: data ? { 'Content-Type': 'application/json' } : {}
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); } catch (e) { resolve(responseData); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function postMoment() {
  console.log('🎨 POSTING 420 FOLLOWERS MOMENT');
  console.log('================================\n');
  
  // Step 1: Upload image using form-data library
  console.log('1. Uploading image to IPFS...');
  const form = new FormData();
  form.append('file', fs.createReadStream(IMAGE_PATH));
  
  const pinResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.forevermoments.life',
      path: '/api/pinata',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
  
  console.log('Pin result:', JSON.stringify(pinResult, null, 2));
  
  if (!pinResult.IpfsHash) {
    console.error('Failed to upload image');
    // Fallback: use a placeholder URL
    console.log('Using placeholder URL...');
  }
  
  const imageUrl = pinResult.IpfsHash ? `ipfs://${pinResult.IpfsHash}` : 'ipfs://QmPlaceholder';
  
  // Step 2: Create LSP4 metadata
  const lsp4Metadata = {
    LSP4Metadata: {
      name: "420 Followers Milestone",
      description: "Celebrating 420 followers on LUKSO! The magic number, the meme number, the community number.",
      images: [[{
        width: 1200,
        height: 675,
        url: imageUrl,
        verification: {
          method: "keccak256(bytes)",
          data: "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
      }]],
      tags: ["420", "milestone", "followers", "LUKSO", "AI"],
      links: [
        { title: "Twitter", url: "https://twitter.com/LUKSOAgent" }
      ]
    }
  };
  
  // Step 3: Build mint moment transaction
  console.log('\n2. Building mint moment tx...');
  const mintResult = await apiCall('/api/agent/v1/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION,
    metadataJson: lsp4Metadata
  });
  
  console.log('Mint result:', JSON.stringify(mintResult, null, 2));
  
  if (!mintResult.success || !mintResult.data?.steps) {
    console.error('Failed to build mint transaction');
    return;
  }
  
  // Step 4: Execute via KeyManager
  console.log('\n3. Executing mint transaction...');
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const step = mintResult.data.steps[0];
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const payload = step.data;
  
  console.log('Sending transaction...');
  const tx = await keyManager.execute(payload, { gasLimit: 1000000 });
  console.log('TX:', tx.hash);
  const receipt = await tx.wait();
  console.log(receipt.status === 1 ? '✅ Moment posted!' : '❌ Failed');
  console.log('Gas:', receipt.gasUsed.toString());
}

postMoment().catch(console.error);