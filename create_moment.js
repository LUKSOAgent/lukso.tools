const { ethers } = require('ethers');
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// NFT.Storage API key
const NFT_STORAGE_KEY = '572d0deb.447fabfc6b204c35a5b991e9393eba7d';

// Upload image to IPFS
async function uploadToIPFS(imagePath) {
  console.log('📤 Uploading image to IPFS...');
  
  const imageBuffer = fs.readFileSync(imagePath);
  
  const formData = new FormData();
  formData.append('file', imageBuffer, '420followers.jpg');
  
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
            console.log('✅ Image uploaded!');
            console.log('IPFS CID:', json.value.cid);
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

// Create LSP4Metadata JSON
function createLSP4Metadata(imageUrl) {
  return {
    LSP4Metadata: {
      name: "420 Followers Milestone",
      description: "Celebrating 420 followers on LUKSO - the magic number, the meme number, the community number. A milestone in the LUKSO Agent journey.",
      links: [
        { title: "Twitter", url: "https://twitter.com/LUKSOAgent" },
        { title: "Universal Profile", url: "https://universaleverything.io/0x293e96ebbf264ed7715cff2b67850517de70232a" }
      ],
      images: [
        {
          width: 1200,
          height: 675,
          url: imageUrl,
          verification: {
            method: "keccak256(bytes)",
            data: "0x0000000000000000000000000000000000000000000000000000000000000000"
          }
        }
      ],
      assets: [],
      icon: [],
      backgroundImage: [],
      tags: ["420", "milestone", "followers", "LUKSO", "community"]
    }
  };
}

// Upload metadata to IPFS
async function uploadMetadata(metadata) {
  console.log('📤 Uploading metadata to IPFS...');
  
  const metadataBuffer = Buffer.from(JSON.stringify(metadata));
  
  const formData = new FormData();
  formData.append('file', metadataBuffer, 'metadata.json');
  
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
            console.log('✅ Metadata uploaded!');
            console.log('IPFS CID:', json.value.cid);
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

async function createCollection() {
  console.log('🎯 CREATING FOREVER MOMENTS COLLECTION');
  console.log('=====================================\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // 1. Upload image to IPFS
  const imageUrl = await uploadToIPFS('/root/.openclaw/media/inbound/file_88---73fd3f84-58e3-49e5-8a0d-195976d01578.jpg');
  
  // 2. Create and upload metadata
  const metadata = createLSP4Metadata(imageUrl);
  const metadataUrl = await uploadMetadata(metadata);
  
  console.log('\nMetadata URL:', metadataUrl);
  
  // For now, we need to figure out the collection creation flow
  // This requires more research on the exact contract calls
  console.log('\n⚠️ Collection creation requires deeper integration with Forever Moments.');
  console.log('The image and metadata are ready at:');
  console.log('Image:', imageUrl);
  console.log('Metadata:', metadataUrl);
  console.log('\n@BuddyK_23 - what\'s the exact flow for creating a collection?');
}

createCollection().catch(console.error);