const fs = require('fs');

const CONTRACT_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

// Simple curl command to verify
async function verifyViaCurl() {
  const payload = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/verification-payload.json', 'utf8'));
  
  // Get main source
  const mainSource = payload.sources['LSP7Mintable.sol'];
  
  console.log('📝 Contract Verification Command');
  console.log('================================\n');
  
  console.log('API Endpoint:');
  console.log('https://explorer.execution.mainnet.lukso.network/api\n');
  
  console.log('Parameters:');
  console.log('  module: contract');
  console.log('  action: verify');
  console.log('  addressHash:', CONTRACT_ADDRESS);
  console.log('  name: LSP7Mintable');
  console.log('  compilerVersion: v0.8.17+commit.8df45f5f');
  console.log('  optimization: true');
  console.log('  optimizationRuns: 200');
  console.log('  constructorArguments:', payload.constructorArguments);
  console.log('  evmVersion: london');
  console.log('  licenseType: 3');
  console.log('');
  
  // Save source for manual upload
  fs.writeFileSync('/root/.openclaw/workspace/agentpo-source.sol', mainSource);
  
  console.log('📁 Files saved:');
  console.log('  - /root/.openclaw/workspace/agentpo-source.sol');
  console.log('  - /root/.openclaw/workspace/verification-payload.json');
  console.log('');
  
  console.log('🔗 Direct verification URL:');
  console.log('https://explorer.execution.mainnet.lukso.network/address/' + CONTRACT_ADDRESS + '/contract-verification');
  console.log('');
  
  console.log('⚠️  Note: Contract uses imports which require flattening.');
  console.log('   For now, use the web interface or provide LYX for me to try alternative verification.');
}

verifyViaCurl();