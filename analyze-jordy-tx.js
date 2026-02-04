const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const JORDY_TX = '0x81195750a4ec859286f91e95b2b9697cd35513081da314aed05a4c5b10b0b2c0';

async function analyze() {
  console.log('🔍 Analyzing Jordy Transaction\n');
  
  // Get from Blockscout API
  const https = require('https');
  
  const url = `https://explorer.execution.mainnet.lukso.network/api?module=transaction&action=gettxinfo&txhash=${JORDY_TX}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.status === '1') {
          const tx = result.result;
          
          console.log('Transaction Details:');
          console.log('  From:', tx.from);
          console.log('  To:', tx.to);
          console.log('  Value:', ethers.formatEther(tx.value), 'LYX');
          console.log('  Gas Used:', tx.gasUsed);
          console.log('  Success:', tx.success);
          console.log('');
          
          // Decode input
          const routerAbi = [
            'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
          ];
          
          const iface = new ethers.Interface(routerAbi);
          
          try {
            const decoded = iface.parseTransaction({ 
              data: tx.input, 
              value: tx.value 
            });
            
            console.log('Decoded Input:');
            console.log('  Function:', decoded.name);
            console.log('  Token:', decoded.args.token);
            console.log('  Amount Token Desired:', ethers.formatEther(decoded.args.amountTokenDesired));
            console.log('  Amount Token Min:', ethers.formatEther(decoded.args.amountTokenMin));
            console.log('  Amount ETH Min:', ethers.formatEther(decoded.args.amountETHMin));
            console.log('  To:', decoded.args.to);
            console.log('');
            
            // Check this token
            checkToken(decoded.args.token);
            
          } catch (e) {
            console.log('Could not decode:', e.message);
          }
        }
      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('HTTP Error:', e.message);
  });
}

async function checkToken(tokenAddress) {
  console.log('\n🔍 Checking Token:', tokenAddress);
  
  const tokenAbi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
  ];
  
  try {
    const token = new ethers.Contract(tokenAddress, tokenAbi, provider);
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    
    console.log('  Name:', name);
    console.log('  Symbol:', symbol);
    console.log('  Decimals:', decimals);
    console.log('');
    console.log('Comparison with AGENTPO:');
    console.log('  Jordy used:', symbol, '(LSP7 compatible?)');
    console.log('  I used: AGENTPO');
    
  } catch (e) {
    console.log('  Error reading token:', e.message);
  }
}

analyze();