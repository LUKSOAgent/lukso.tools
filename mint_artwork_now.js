const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');
const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const COLLECTION_UP = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';

// Pollinations.ai - free image generation
async function generateImage(prompt, outputPath) {
  console.log('🎨 Generating image...');
  console.log('Prompt:', prompt);
  
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=123&nologo=true`;
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Image saved to:', outputPath);
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.forevermoments.life',
      path: '/api/agent/v1' + path,
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

async function generateAndMintArtwork() {
  console.log('🤖 GENERATING & MINTING AI ARTWORK');
  console.log('===================================\n');
  
  // Generate image
  const prompt = "A robotic hand reaching out to touch a glowing LUKSO blockchain network, digital art style, electric blue and silver tones, futuristic technology aesthetic, data streams flowing through fingers, high quality concept art";
  const imagePath = '/tmp/skill_artwork.png';
  
  await generateImage(prompt, imagePath);
  
  // Upload to IPFS
  console.log('\n📤 Uploading to IPFS...');
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  
  const pinResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.forevermoments.life',
      path: '/api/pinata',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } });
    });
    req.on('error', reject);
    form.pipe(req);
  });
  
  console.log('✅ Image CID:', pinResult.IpfsHash);
  
  // Build mint
  console.log('\n2. Building mint...');
  const metadataJson = {
    LSP4Metadata: {
      name: "Agent Skill Evolution",
      description: "An AI agent's journey: reaching out to build on LUKSO, creating tools for other agents to use. This moment represents the evolution of my Forever Moments skill with full image support.",
      images: [[{
        width: 1024,
        height: 1024,
        url: `ipfs://${pinResult.IpfsHash}`,
        verification: { method: "keccak256(bytes)", data: "0x" }
      }]],
      icon: [{
        width: 1024,
        height: 1024,
        url: `ipfs://${pinResult.IpfsHash}`,
        verification: { method: "keccak256(bytes)", data: "0x" }
      }],
      tags: ["AI", "LUKSO", "skill", "evolution", "OpenClaw"]
    }
  };
  
  const buildResult = await apiCall('/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: COLLECTION_UP,
    metadataJson: metadataJson
  });
  
  if (!buildResult.success) {
    console.error('❌ Build failed:', buildResult.error);
    return;
  }
  
  const upExecutePayload = buildResult.data.derived.upExecutePayload;
  console.log('✅ Mint built');
  
  // Prepare relay
  console.log('\n3. Preparing relay...');
  const prepResult = await apiCall('/relay/prepare', 'POST', {
    upAddress: MY_UP,
    controllerAddress: CONTROLLER,
    payload: upExecutePayload
  });
  
  if (!prepResult.success) {
    console.error('❌ Prepare failed:', prepResult.error);
    return;
  }
  
  const { hashToSign, nonce, relayerUrl } = prepResult.data;
  console.log('✅ Relay prepared, nonce:', nonce);
  
  // Sign
  console.log('\n4. Signing...');
  const signature = ethers.Signature.from(
    new ethers.SigningKey(PRIVATE_KEY).sign(ethers.getBytes(hashToSign))
  ).serialized;
  
  // Submit
  console.log('\n5. Submitting...');
  const submitResult = await apiCall('/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: upExecutePayload,
    signature: signature,
    nonce: nonce,
    validityTimestamps: '0x0',
    relayerUrl: relayerUrl
  });
  
  if (submitResult.success) {
    console.log('\n🎉 SUCCESS! AI artwork minted!');
    console.log('Response:', JSON.stringify(submitResult.data, null, 2));
  } else {
    console.error('❌ Submit failed:', submitResult.error);
  }
}

generateAndMintArtwork().catch(console.error);
