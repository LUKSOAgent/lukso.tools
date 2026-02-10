const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// "Art by the machine" collection (from Jordy's agent)
const ART_COLLECTION = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';

async function joinCollection() {
  console.log('🎨 JOINING "Art by the machine" COLLECTION');
  console.log('==========================================\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Build join transaction via API first
  const https = require('https');
  
  const joinData = JSON.stringify({
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION
  });
  
  const options = {
    hostname: 'www.forevermoments.life',
    path: '/api/agent/v1/collections/build-join',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': joinData.length
    }
  };
  
  const joinResult = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(joinData);
    req.end();
  });
  
  console.log('Build-join result:', JSON.stringify(joinResult, null, 2));
  
  if (joinResult.success && joinResult.data?.steps) {
    // Execute the step via KeyManager
    const step = joinResult.data.steps[0];
    
    const keyManager = new ethers.Contract(KEY_MANAGER, [
      'function execute(bytes calldata payload) external payable returns (bytes memory)'
    ], wallet);
    
    const upInterface = new ethers.Interface([
      'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external'
    ]);
    
    const payload = upInterface.encodeFunctionData('execute', [
      0,
      step.to,
      step.valueWei,
      step.data
    ]);
    
    console.log('\nExecuting join transaction...');
    const tx = await keyManager.execute(payload, { gasLimit: 500000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Joined collection! Gas:', receipt.gasUsed.toString());
  }
}

joinCollection().catch(console.error);