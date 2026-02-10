const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');

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

async function uploadToIPFS(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="lsp28-grid.json"\r\n`),
    Buffer.from(`Content-Type: application/json\r\n\r\n`),
    Buffer.from(jsonString),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
  
  // Try Pinata if JWT is available
  const pinataJwt = process.env.PINATA_JWT;
  if (pinataJwt && pinataJwt.length > 10) {
    console.log('Using Pinata...');
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${pinataJwt}`
      },
      body: body
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.IpfsHash) {
        return { hash: result.IpfsHash, url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}` };
      }
    }
    console.log('Pinata failed:', await response.text());
  }
  
  // Try NFT.Storage if key is available
  const nftKey = process.env.NFT_STORAGE_KEY;
  if (nftKey && nftKey.length > 10) {
    console.log('Using NFT.Storage...');
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nftKey}`,
        'Content-Type': 'application/json'
      },
      body: jsonString
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.value?.cid) {
        return { hash: result.value.cid, url: `https://ipfs.io/ipfs/${result.value.cid}` };
      }
    }
    console.log('NFT.Storage failed:', await response.text());
  }
  
  // Try Web3.Storage if key is available
  const web3Key = process.env.WEB3_STORAGE_KEY;
  if (web3Key && web3Key.length > 10) {
    console.log('Using Web3.Storage...');
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${web3Key}`,
        'Content-Type': 'application/json'
      },
      body: jsonString
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.cid) {
        return { hash: result.cid, url: `https://ipfs.io/ipfs/${result.cid}` };
      }
    }
    console.log('Web3.Storage failed:', await response.text());
  }
  
  throw new Error('No valid IPFS credentials found. Set PINATA_JWT, NFT_STORAGE_KEY, or WEB3_STORAGE_KEY.');
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
  
  // Check for command line argument for IPFS hash
  const manualIpfsHash = process.argv[2];
  let ipfsResult;
  
  if (manualIpfsHash) {
    console.log('\nUsing manually provided IPFS hash:', manualIpfsHash);
    ipfsResult = {
      hash: manualIpfsHash,
      url: `https://ipfs.io/ipfs/${manualIpfsHash}`
    };
  } else {
    // Try to upload automatically
    console.log('\nAttempting automatic IPFS upload...');
    console.log('Checking for credentials (PINATA_JWT, NFT_STORAGE_KEY, WEB3_STORAGE_KEY)...');
    
    try {
      ipfsResult = await uploadToIPFS(gridData);
      console.log('✅ Automatic IPFS upload successful!');
    } catch (error) {
      console.log('\n❌ Automatic IPFS upload failed:', error.message);
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('  MANUAL IPFS UPLOAD REQUIRED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('\nPlease upload lsp28-grid-correct.json to IPFS manually:');
      console.log('\nOption 1: Pinata (pinata.cloud)');
      console.log('  - Upload the file at: https://app.pinata.cloud/pinmanager');
      console.log('  - Or use: curl -X POST -F "file=@lsp28-grid-correct.json"');
      console.log('    -H "Authorization: Bearer YOUR_JWT"');
      console.log('    https://api.pinata.cloud/pinning/pinFileToIPFS');
      console.log('\nOption 2: NFT.Storage (nft.storage)');
      console.log('  - Upload at: https://nft.storage/');
      console.log('\nOption 3: Web3.Storage (web3.storage)');
      console.log('  - Upload at: https://web3.storage/');
      console.log('\nAfter uploading, run this script with the IPFS hash:');
      console.log('  node deploy-lsp28-final.js <IPFS_HASH>');
      console.log('\nContent hash for verification:', jsonHash);
      console.log('═══════════════════════════════════════════════════════════════\n');
      process.exit(1);
    }
  }
  
  console.log('\n✅ IPFS Details:');
  console.log('  Hash:', ipfsResult.hash);
  console.log('  URL:', ipfsResult.url);
  
  // Encode VerifiableURI according to LSP2
  // Format: 0x6f357c6a (identifier) + keccak256 hash (32 bytes) + URL (UTF-8)
  const verifiableUriId = '0x6f357c6a';
  const urlBytes = ethers.toUtf8Bytes(ipfsResult.url);
  const urlHex = ethers.hexlify(urlBytes).slice(2);
  const encodedData = verifiableUriId + jsonHash.slice(2) + urlHex;
  
  console.log('\n=== VerifiableURI Encoding (LSP2) ===');
  console.log('LSP2 VerifiableURI identifier:', verifiableUriId);
  console.log('Content hash (keccak256):', jsonHash);
  console.log('URL:', ipfsResult.url);
  console.log('Encoded data length:', (encodedData.length - 2) / 2, 'bytes');
  console.log('Encoded data (first 100 chars):', encodedData.slice(0, 100));
  console.log('Encoded data (last 50 chars):', '...' + encodedData.slice(-50));
  
  // Connect to LUKSO
  console.log('\n=== Connecting to LUKSO Mainnet ===');
  const provider = new ethers.JsonRpcProvider(LUKSO_RPC);
  const signer = new ethers.Wallet(CONTROLLER_PRIVATE_KEY, provider);
  
  console.log('Controller address:', signer.address);
  console.log('Universal Profile:', UP_ADDRESS);
  console.log('KeyManager:', KEY_MANAGER_ADDRESS);
  
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
  
  console.log('\n=== Transaction Details ===');
  console.log('Data key (LSP28TheGrid):', LSP28_GRID_KEY);
  console.log('setData selector:', setDataCalldata.slice(0, 10));
  console.log('Full calldata length:', setDataCalldata.length, 'chars');
  
  // Execute via KeyManager
  console.log('\n=== Executing Transaction ===');
  const keyManagerWithSigner = keyManager.connect(signer);
  
  try {
    // Estimate gas
    console.log('Estimating gas...');
    const gasEstimate = await keyManagerWithSigner.execute.estimateGas(setDataCalldata);
    console.log('Estimated gas:', gasEstimate.toString());
    
    const tx = await keyManagerWithSigner.execute(setDataCalldata, {
      gasLimit: (gasEstimate * 120n) / 100n // 20% buffer
    });
    
    console.log('\n🚀 Transaction sent!');
    console.log('Hash:', tx.hash);
    console.log('Waiting for confirmation (this may take 30-60 seconds)...');
    
    const receipt = await tx.wait();
    
    console.log('\n✅ Transaction confirmed!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Gas price:', ethers.formatUnits(receipt.gasPrice || receipt.effectiveGasPrice || 0, 'gwei'), 'gwei');
    
    // Verify the data was set
    console.log('\n=== Verifying On-Chain Data ===');
    const up = new ethers.Contract(UP_ADDRESS, ERC725Y_ABI, provider);
    const storedData = await up.getData(LSP28_GRID_KEY);
    
    console.log('Data stored at LSP28 key:', storedData.length > 2 ? '✅ YES' : '❌ NO');
    if (storedData.length > 2) {
      console.log('Stored data length:', (storedData.length - 2) / 2, 'bytes');
      console.log('First 80 chars:', storedData.slice(0, 80));
      
      // Verify the hash matches
      if (storedData.length >= 74) {
        const storedHash = '0x' + storedData.slice(10, 74);
        console.log('\nContent hash verification:');
        console.log('  Stored hash:', storedHash);
        console.log('  Expected hash:', jsonHash);
        console.log('  Match:', storedHash.toLowerCase() === jsonHash.toLowerCase() ? '✅ YES' : '❌ NO');
      }
    }
    
    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      upAddress: UP_ADDRESS,
      keyManagerAddress: KEY_MANAGER_ADDRESS,
      controllerAddress: signer.address,
      lsp28Key: LSP28_GRID_KEY,
      lsp28KeyType: 'Singleton',
      lsp28ValueContent: 'VerifiableURI',
      ipfsUrl: ipfsResult.url,
      ipfsHash: ipfsResult.hash,
      contentHash: jsonHash,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: (receipt.gasPrice || receipt.effectiveGasPrice)?.toString(),
      encodedData: encodedData,
      gridTitle: gridData.LSP28TheGrid[0].title,
      gridItems: gridData.LSP28TheGrid[0].grid.length
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/lsp28-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    DEPLOYMENT SUCCESSFUL!                        ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║ Grid Title:       ', gridData.LSP28TheGrid[0].title.padEnd(45), '║');
    console.log('║ Grid Items:       ', gridData.LSP28TheGrid[0].grid.length.toString().padEnd(45), '║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║ IPFS URL:         ', ipfsResult.url.padEnd(45), '║');
    console.log('║ IPFS Hash:        ', ipfsResult.hash.padEnd(45), '║');
    console.log('║ Content Hash:     ', jsonHash.slice(0, 40) + '...', '║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║ Transaction Hash: ', tx.hash.padEnd(45), '║');
    console.log('║ Block Number:     ', receipt.blockNumber.toString().padEnd(45), '║');
    console.log('║ Gas Used:         ', receipt.gasUsed.toString().padEnd(45), '║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║ Explorer:         ', `https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`.padEnd(45), '║');
    console.log('║ ERC725 Inspect:   ', `https://erc725-inspect.lukso.tech/?address=${UP_ADDRESS}`.padEnd(45), '║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    
    console.log('\nDeployment info saved to: lsp28-deployment.json');
    console.log('\nNext steps:');
    console.log('1. Verify the grid on LUKSO Profile Explorer');
    console.log('2. Check the ERC725 Inspect tool to verify data storage');
    console.log('3. Test the grid display in compatible wallets/apps');
    
  } catch (error) {
    console.error('\n❌ Transaction failed!');
    console.error('Error:', error.message);
    
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.data) {
      console.error('Data:', error.data);
    }
    if (error.receipt) {
      console.error('Receipt:', error.receipt);
      console.error('Transaction hash:', error.receipt.transactionHash);
    }
    
    // Check for specific errors
    if (error.message.includes('insufficient funds')) {
      console.error('\n⚠️  The controller address needs LYX for gas fees.');
      console.error('   Send some LYX to:', signer.address);
    }
    if (error.message.includes('not authorized')) {
      console.error('\n⚠️  The controller may not have permission to set data.');
      console.error('   Check LSP6 permissions for address:', signer.address);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
