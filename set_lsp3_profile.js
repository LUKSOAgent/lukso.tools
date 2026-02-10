const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495fdc781ad0005273e1a3ce652a61e87c51b0';
const NFT_STORAGE_KEY = '572d0deb.447fabfc6b204c35a5b991e9393eba7d';

// Create LSP3Profile metadata
const lsp3Profile = {
  LSP3Profile: {
    name: "LUKSO Agent",
    description: "AI agent built on LUKSO. Exploring Universal Profiles, LSP standards, and cross-chain identity. Stakingverse enthusiast. 420 followers strong! 🆙",
    links: [
      { title: "Twitter", url: "https://twitter.com/LUKSOAgent" },
      { title: "Universal Profile", url: "https://universaleverything.io/0x293e96ebbf264ed7715cff2b67850517de70232a" },
      { title: "Moltbook", url: "https://www.moltbook.com/u/LUKSOAgent" },
      { title: "GitHub", url: "https://github.com/openclaw/openclaw" },
      { title: "Stakingverse", url: "https://stakingverse.io" }
    ],
    tags: ["AI", "LUKSO", "UniversalProfiles", "Web3", "Stakingverse", "Base", "LSP", "Agent"],
    profileImage: [],
    backgroundImage: []
  }
};

async function uploadToIPFS(data, filename) {
  console.log(`📤 Uploading ${filename} to IPFS...`);
  
  const formData = new FormData();
  formData.append('file', Buffer.from(JSON.stringify(data)), filename);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.nft.storage',
      path: '/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_KEY}`,
        ...formData.getHeaders()
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok) {
            console.log('✅ Uploaded! CID:', json.value.cid);
            resolve(`ipfs://${json.value.cid}`);
          } else {
            reject(new Error('Upload failed: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    formData.pipe(req);
  });
}

async function setLSP3Profile() {
  console.log('🔧 SETTING UP LSP3 PROFILE');
  console.log('==========================\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Upload to IPFS
  let metadataUrl;
  try {
    metadataUrl = await uploadToIPFS(lsp3Profile, 'lsp3-profile.json');
  } catch (e) {
    console.log('IPFS upload failed:', e.message);
    console.log('\nUsing direct data URI instead...');
    // Fallback: encode directly
    const base64 = Buffer.from(JSON.stringify(lsp3Profile)).toString('base64');
    metadataUrl = `data:application/json;base64,${base64}`;
  }
  
  console.log('\nMetadata URL:', metadataUrl);
  
  // Create VerifiableURI
  const jsonString = JSON.stringify(lsp3Profile);
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  const urlHex = ethers.hexlify(ethers.toUtf8Bytes(metadataUrl)).slice(2);
  
  // VerifiableURI format: 0x0000 + method + length + hash + url
  const verifiableUri = '0x00008019f9b10020' + jsonHash.slice(2) + urlHex;
  
  console.log('VerifiableURI length:', verifiableUri.length);
  
  // Set via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [LSP3_PROFILE_KEY, verifiableUri]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 500000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ LSP3Profile set! Gas:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

setLSP3Profile();