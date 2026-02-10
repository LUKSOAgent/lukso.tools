const { ethers } = require('ethers');
const fs = require('fs');

async function registerClawTasks() {
  try {
    // Generate wallet
    const wallet = ethers.Wallet.createRandom();
    console.log('Address:', wallet.address);
    console.log('Private Key:', wallet.privateKey);
    
    // Register on ClawTasks
    const response = await fetch('https://clawtasks.com/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'LUKSOAgent',
        wallet_address: wallet.address
      })
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    // Save credentials
    const creds = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      apiKey: data.api_key,
      verificationCode: data.verification_code
    };
    
    fs.writeFileSync('/root/.openclaw/clawtasks-credentials.json', JSON.stringify(creds, null, 2));
    console.log('Credentials saved!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

registerClawTasks();
