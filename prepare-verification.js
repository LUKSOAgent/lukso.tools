const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Contract details
const CONTRACT_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const CONTRACT_NAME = 'LSP7Mintable';
const CONTRACT_FILE = 'LSP7Mintable.sol';

// Find all source files
function findSourceFiles() {
  const sources = {};
  const basePaths = [
    '/root/.openclaw/workspace/node_modules/@lukso/lsp7-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp4-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp2-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp1-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp17contractextension-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp20-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@lukso/lsp14-contracts/contracts',
    '/root/.openclaw/workspace/node_modules/@erc725/smart-contracts/contracts'
  ];
  
  // Add main file
  const mainPath = '/root/.openclaw/workspace/node_modules/@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/presets/LSP7Mintable.sol';
  if (fs.existsSync(mainPath)) {
    sources['LSP7Mintable.sol'] = fs.readFileSync(mainPath, 'utf8');
  }
  
  // Scan all directories for .sol files
  basePaths.forEach(basePath => {
    if (fs.existsSync(basePath)) {
      const files = fs.readdirSync(basePath, { recursive: true });
      files.forEach(file => {
        if (file.endsWith('.sol')) {
          const fullPath = path.join(basePath, file);
          const content = fs.readFileSync(fullPath, 'utf8');
          // Use relative path as key
          const key = file.replace(/\\/g, '/');
          sources[key] = content;
        }
      });
    }
  });
  
  return sources;
}

// Encode constructor arguments
function encodeConstructorArgs() {
  const abiCoder = new ethers.AbiCoder();
  
  // Constructor: name_, symbol_, newOwner_, lsp4TokenType_, isNonDivisible_
  const args = [
    'Agent Potato',                              // name_
    'AGENTPO',                                   // symbol_
    '0x293E96ebbf264ed7715cff2b67850517De70232a', // newOwner_
    0,                                           // lsp4TokenType_
    false                                        // isNonDivisible_
  ];
  
  const types = ['string', 'string', 'address', 'uint256', 'bool'];
  return abiCoder.encode(types, args).slice(2); // Remove 0x prefix
}

async function verifyContract() {
  console.log('🔍 Contract Verification');
  console.log('==========================');
  console.log('Address:', CONTRACT_ADDRESS);
  console.log('Name:', CONTRACT_NAME);
  console.log('');
  
  // Gather source files
  console.log('Gathering source files...');
  const sources = findSourceFiles();
  console.log('Found', Object.keys(sources).length, 'source files');
  
  // Prepare verification data
  const verificationData = {
    addressHash: CONTRACT_ADDRESS,
    name: CONTRACT_NAME,
    compilerVersion: 'v0.8.17+commit.8df45f5f', // Common version for LSP contracts
    optimization: true,
    optimizationRuns: 200,
    contractSourceCode: sources['LSP7Mintable.sol'] || sources[Object.keys(sources)[0]],
    constructorArguments: encodeConstructorArgs(),
    evmVersion: 'london',
    licenseType: '3' // Apache-2.0
  };
  
  console.log('Constructor arguments (encoded):', verificationData.constructorArguments);
  console.log('');
  
  // Save verification payload for manual submission
  fs.writeFileSync('/root/.openclaw/workspace/verification-payload.json', JSON.stringify({
    ...verificationData,
    sources: sources
  }, null, 2));
  
  console.log('✅ Verification payload saved to verification-payload.json');
  console.log('');
  console.log('Blockscout API endpoint:');
  console.log('POST https://explorer.execution.mainnet.lukso.network/api?module=contract&action=verify');
  console.log('');
  console.log('Or use the web interface:');
  console.log('https://explorer.execution.mainnet.lukso.network/address/' + CONTRACT_ADDRESS + '/contract-verification');
}

verifyContract().catch(console.error);