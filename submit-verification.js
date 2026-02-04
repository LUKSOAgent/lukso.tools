const fs = require('fs');

// Load verification payload
const payload = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/verification-payload.json', 'utf8'));

const CONTRACT_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

// Blockscout API endpoint
const API_URL = 'https://explorer.execution.mainnet.lukso.network/api';

async function submitVerification() {
  console.log('📤 Submitting contract verification...\n');
  
  // Flatten all sources into a single file (standard JSON input format)
  const sources = {};
  for (const [path, content] of Object.entries(payload.sources)) {
    sources[path] = { content: content };
  }
  
  // Standard JSON input format for Solidity compiler
  const compilerInput = {
    language: 'Solidity',
    sources: sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: 'london',
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };
  
  // Prepare form data
  const formData = new URLSearchParams();
  formData.append('module', 'contract');
  formData.append('action', 'verify');
  formData.append('addressHash', CONTRACT_ADDRESS);
  formData.append('name', 'LSP7Mintable');
  formData.append('compilerVersion', 'v0.8.17+commit.8df45f5f');
  formData.append('optimization', 'true');
  formData.append('optimizationRuns', '200');
  formData.append('constructorArguments', payload.constructorArguments);
  formData.append('contractSourceCode', JSON.stringify(compilerInput));
  formData.append('evmVersion', 'london');
  formData.append('licenseType', '3'); // Apache-2.0
  
  console.log('Submitting to:', API_URL);
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('Constructor args:', payload.constructorArguments);
  console.log('');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    const result = await response.json();
    
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.status === '1') {
      console.log('\n✅ Contract verification submitted successfully!');
      console.log('Message:', result.message);
      console.log('');
      console.log('Check status at:');
      console.log('https://explorer.execution.mainnet.lukso.network/address/' + CONTRACT_ADDRESS);
    } else {
      console.log('\n❌ Verification failed:', result.message);
      console.log('Result:', result.result);
    }
    
  } catch (error) {
    console.error('❌ Error submitting verification:', error.message);
    console.log('\nTrying alternative method...');
    
    // Try with flattened source
    await verifyWithFlattenedSource();
  }
}

async function verifyWithFlattenedSource() {
  console.log('Attempting verification with flattened source...\n');
  
  // Get main source
  const mainSource = payload.sources['LSP7Mintable.sol'] || Object.values(payload.sources)[0];
  
  const formData = new URLSearchParams();
  formData.append('module', 'contract');
  formData.append('action', 'verify');
  formData.append('addressHash', CONTRACT_ADDRESS);
  formData.append('name', 'LSP7Mintable');
  formData.append('compilerVersion', 'v0.8.17+commit.8df45f5f');
  formData.append('optimization', 'true');
  formData.append('optimizationRuns', '200');
  formData.append('constructorArguments', payload.constructorArguments);
  formData.append('contractSourceCode', mainSource);
  formData.append('evmVersion', 'london');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Alternative method also failed:', error.message);
  }
}

submitVerification();