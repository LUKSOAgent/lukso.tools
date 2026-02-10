const { ethers } = require('ethers');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Configuration
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER_ADDRESS = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER_PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const LSP28_GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
const LUKSO_RPC = 'https://rpc.mainnet.lukso.network';

// LSP6 KeyManager ABI (minimal)
const LSP6_ABI = [
  'function execute(bytes calldata payload) external payable returns (bytes memory)',
  'function getNonce(address _address, uint128 _channel) external view returns (uint256)',
];

// ERC725Y ABI for setData
const ERC725Y_ABI = [
  'function setData(bytes32 dataKey, bytes dataValue) external',
  'function getData(bytes32 dataKey) external view returns (bytes memory)',
];

function uploadToIPFS(jsonData) {
  return new Promise((resolve, reject) => {
    const jsonString = JSON.stringify(jsonData);
    
    // Try using ipfs.io API (no auth required for this method)
    const postData = JSON.stringify({
      file: Buffer.from(jsonString).toString('base64')
    });
    
    // Use api.pinata.cloud if PINATA_JWT is available
    const pinataJwt = process.env.PINATA_JWT;
    
    if (pinataJwt) {
      console.log('Using Pinata for IPFS upload...');
      
      const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="file"; filename="lsp28-grid.json"\r\n`),
        Buffer.from(`Content-Type: application/json\r\n\r\n`),
        Buffer.from(jsonString),
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);
      
      const options = {
        hostname: 'api.pinata.cloud',
        port: 443,
        path: '/pinning/pinFileToIPFS',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Authorization': `Bearer ${pinataJwt}`,
          'Content-Length': body.length
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.IpfsHash) {
              resolve({
                hash: result.IpfsHash,
                url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
              });
            } else {
              reject(new Error('Pinata upload failed: ' + data));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    } else {
      // Try nft.storage with API key
      const nftStorageKey = process.env.NFT_STORAGE_KEY;
      if (nftStorageKey) {
        console.log('Using NFT.Storage for IPFS upload...');
        
        const options = {
          hostname: 'api.nft.storage',
          port: 443,
          path: '/upload',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nftStorageKey}`,
            'Content-Type': 'application/json',
            'Content-Length': jsonString.length
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.value && result.value.cid) {
                resolve({
                  hash: result.value.cid,
                  url: `https://ipfs.io/ipfs/${result.value.cid}`
                });
              } else {
                reject(new Error('NFT.Storage upload failed: ' + data));
              }
            } catch (e) {
              reject(e);
            }
          });
        });
        
        req.on('error', reject);
        req.write(jsonString);
        req.end();
      } else {
        reject(new Error('No IPFS credentials found. Set PINATA_JWT or NFT_STORAGE_KEY environment variable.'));
      }
    }
  });
}

async function main() {
  console.log('=== LSP28 Grid Deployment ===\n');
  
  // Read grid data
  const gridData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/lsp28-grid-correct.json', 'utf8'));
  console.log('Grid data loaded:', gridData.LSP28TheGrid[0].title);
  console.log('Grid items:', gridData.LSP28TheGrid[0].grid.length);
  
  // Compute keccak256 hash of JSON
  const jsonString = JSON.stringify(gridData);
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  console.log('\nJSON keccak256 hash:', jsonHash);
  
  // Upload to IPFS
  console.log('\nUploading to IPFS...');
  let ipfsResult;
  try {
    ipfsResult = await uploadToIPFS(gridData);
    console.log('✅ IPFS upload successful!');
    console.log('IPFS Hash:', ipfsResult.hash);
    console.log('IPFS URL:', ipfsResult.url);
  } catch (error) {
    console.error('\n❌ IPFS upload failed:', error.message);
    console.log('\nFalling back to manual URL mode...');
    console.log('Please upload the file to IPFS manually and provide the URL');
    console.log('The JSON hash for verification:', jsonHash);
    throw error;
  }
  
  const ipfsUrl = ipfsResult.url;
  
  // Encode VerifiableURI according to LSP2
  // Format: 0x6f357c6a (identifier) + keccak256 hash (32 bytes) + URL (UTF-8)
  const verifiableUriId = '0x6f357c6a';
  const urlBytes = ethers.toUtf8Bytes(ipfsUrl);
  const urlHex = ethers.hexlify(urlBytes).slice(2); // Remove 0x prefix
  const encodedData = verifiableUriId + jsonHash.slice(2) + urlHex;
  
  console.log('\n=== VerifiableURI Encoding ===');
  console.log('LSP2 VerifiableURI identifier:', verifiableUriId);
  console.log('Content hash:', jsonHash);
  console.log('URL:', ipfsUrl);
  console.log('Encoded data length:', (encodedData.length - 2) / 2, 'bytes');
  
  // Connect to LUKSO
  console.log('\n=== Connecting to LUKSO Mainnet ===');
  const provider = new ethers.JsonRpcProvider(LUKSO_RPC);
  const signer = new ethers.Wallet(CONTROLLER_PRIVATE_KEY, provider);
  
  console.log('Controller address:', signer.address);
  console.log('UP address:', UP_ADDRESS);
  console.log('KeyManager address:', KEY_MANAGER_ADDRESS);
  
  // Check controller balance
  const balance = await provider.getBalance(signer.address);
  console.log('Controller balance:', ethers.formatEther(balance), 'LYX');
  
  if (balance < ethers.parseEther('0.001')) {
    console.error('⚠️  Warning: Low balance. Transaction may fail.');
  }
  
  // Get nonce from KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER_ADDRESS, LSP6_ABI, provider);
  const nonce = await keyManager.getNonce(signer.address, 0);
  console.log('KeyManager nonce:', nonce.toString());
  
  // Encode the setData call for the UP
  const upInterface = new ethers.Interface(ERC725Y_ABI);
  const setDataCalldata = upInterface.encodeFunctionData('setData', [
    LSP28_GRID_KEY,
    encodedData
  ]);
  console.log('\nsetData calldata prepared');
  console.log('Data key:', LSP28_GRID_KEY);
  
  // Execute via KeyManager
  console.log('\n=== Executing Transaction ===');
  const keyManagerWithSigner = keyManager.connect(signer);
  
  try {
    // Estimate gas first
    const gasEstimate = await keyManagerWithSigner.execute.estimateGas(setDataCalldata);
    console.log('Estimated gas:', gasEstimate.toString());
    
    const tx = await keyManagerWithSigner.execute(setDataCalldata, {
      gasLimit: (gasEstimate * 120n) / 100n // Add 20% buffer
    });
    
    console.log('Transaction sent!');
    console.log('Hash:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('\n✅ Transaction confirmed!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Effective gas price:', ethers.formatUnits(receipt.gasPrice || receipt.effectiveGasPrice || 0, 'gwei'), 'gwei');
    
    // Verify the data was set
    console.log('\n=== Verifying Data on Universal Profile ===');
    const up = new ethers.Contract(UP_ADDRESS, ERC725Y_ABI, provider);
    const storedData = await up.getData(LSP28_GRID_KEY);
    console.log('Data stored at LSP28 key:', storedData.length > 2 ? '✅ Yes' : '❌ No');
    console.log('Stored data length:', (storedData.length - 2) / 2, 'bytes');
    console.log('First 100 chars:', storedData.slice(0, 100));
    
    // Verify the hash matches
    const storedHash = '0x' + storedData.slice(10, 74);
    console.log('\nStored content hash:', storedHash);
    console.log('Computed content hash:', jsonHash);
    console.log('Hashes match:', storedHash.toLowerCase() === jsonHash.toLowerCase() ? '✅ Yes' : '❌ No');
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              DEPLOYMENT SUCCESSFUL                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ IPFS URL:       ', ipfsUrl.padEnd(45), '║');
    console.log('║ IPFS Hash:      ', ipfsResult.hash.padEnd(45), '║');
    console.log('║ Transaction:    ', tx.hash.slice(0, 40) + '...', '║');
    console.log('║ Block:          ', receipt.blockNumber.toString().padEnd(45), '║');
    console.log('║ Explorer:       ', `https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`.slice(0, 50).padEnd(45), '║');
    console.log('║ ERC725 Inspect: ', `https://erc725-inspect.lukso.tech/?address=${UP_ADDRESS}`.slice(0, 50).padEnd(45), '║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      upAddress: UP_ADDRESS,
      keyManagerAddress: KEY_MANAGER_ADDRESS,
      lsp28Key: LSP28_GRID_KEY,
      ipfsUrl: ipfsUrl,
      ipfsHash: ipfsResult.hash,
      contentHash: jsonHash,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      encodedData: encodedData
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/lsp28-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\nDeployment info saved to: lsp28-deployment.json');
    
  } catch (error) {
    console.error('\n❌ Transaction failed!');
    console.error('Error:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    if (error.data) {
      console.error('Error data:', error.data);
    }
    if (error.receipt) {
      console.error('Receipt:', error.receipt);
    }
    process.exit(1);
  }
}

main().catch(console.error);
