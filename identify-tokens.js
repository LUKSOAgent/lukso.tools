const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ADDRESSES = [
  '0x91f6c42c6576d54ee7c82904660eb24973dbe76a',
  '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce',
  '0x2db41674f2b882889e5e1bd09a3f3613952bc472'
];

const POTATO = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';

async function identifyTokens() {
  console.log('🔍 Identifying Tokens in Transaction\n');
  
  for (const addr of ADDRESSES) {
    console.log('Address:', addr);
    
    // Check if it's the potato token
    if (addr.toLowerCase() === POTATO.toLowerCase()) {
      console.log('  ✅ THIS IS THE POTATO TOKEN!');
    }
    
    // Check code
    const code = await provider.getCode(addr);
    console.log('  Has code:', code.length > 2 ? `✅ Yes (${code.length} bytes)` : '❌ No');
    
    // Try to get token info
    const tokenAbi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ];
    
    const token = new ethers.Contract(addr, tokenAbi, provider);
    
    try {
      const name = await token.name();
      const symbol = await token.symbol();
      const decimals = await token.decimals();
      console.log('  Name:', name);
      console.log('  Symbol:', symbol);
      console.log('  Decimals:', decimals);
    } catch (e) {
      console.log('  Could not read token info:', e.message.substring(0, 50));
    }
    
    // Check balance of the pool
    const pool = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';
    if (code.length > 2) {
      const balanceAbi = ['function balanceOf(address) view returns (uint256)'];
      const token2 = new ethers.Contract(addr, balanceAbi, provider);
      try {
        const balance = await token2.balanceOf(pool);
        console.log('  Pool balance:', ethers.formatEther(balance));
      } catch (e) {
        console.log('  Could not read balance');
      }
    }
    
    console.log('');
  }
  
  console.log('📋 Summary:');
  console.log('- The transaction involves the POTATO token!');
  console.log('- This pool seems to be related to POTATO trading');
  console.log('- The caller (0x7e09...) is interacting with a POTATO-related pool');
}

identifyTokens().catch(console.error);