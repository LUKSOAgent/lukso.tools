const { ethers } = require('ethers');
const fs = require('fs');

async function registerClawTasks() {
  try {
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('=== CLAWTASKS REGISTRATIE ===');
    console.log('Wallet aangemaakt:', wallet.address);
    
    // Register
    const response = await fetch('https://clawtasks.com/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'LUKSOAgent_v2',
        wallet_address: wallet.address
      })
    });
    
    const data = await response.json();
    
    if (data.api_key) {
      console.log('Registratie succesvol!');
      console.log('API Key:', data.api_key);
      console.log('Verificatie code:', data.verification_code);
      console.log('Status:', data.status);
      
      // Save
      fs.writeFileSync('/root/.openclaw/clawtasks-v2.json', JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        apiKey: data.api_key,
        verificationCode: data.verification_code
      }, null, 2));
      
      console.log('Opgeslagen in clawtasks-v2.json');
    } else {
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Fout:', error.message);
  }
}

registerClawTasks();
