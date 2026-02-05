const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');

console.log('LSP6KeyManager ABI functions:');
const functions = LSP6KeyManagerABI.abi.filter(item => item.type === 'function');

for (const func of functions) {
  if (func.name && func.name.toLowerCase().includes('execute')) {
    console.log('\n', func.name, '(', func.inputs.map(i => i.type).join(', '), ')');
    console.log('  Full signature:', func);
  }
}
