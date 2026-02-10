const { ethers } = require('ethers');

async function deployViaRelayer() {
  console.log('🚀 Starting Universal Profile deployment via Relayer API...\n');

  // Generate a new random wallet for the controller
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Controller Wallet Generated');
  console.log('   Address:', wallet.address);
  console.log('   Private Key:', wallet.privateKey);
  console.log();

  // Prepare the deployment request
  const deployRequest = {
    controller: wallet.address,
    name: 'TestAgent-UP',
    description: 'Testing UP creation via lsp-factory',
    tags: ['test', 'agent']
  };

  console.log('📋 Deployment Configuration:');
  console.log(JSON.stringify(deployRequest, null, 2));
  console.log();

  console.log('⏳ Sending deployment request to LUKSO Relayer...');
  
  try {
    const response = await fetch('https://relayer.mainnet.lukso.network/v1/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deployRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Relayer request failed:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(responseData, null, 2));
      throw new Error(`Relayer API error: ${response.statusText}`);
    }

    console.log('\n✅ Deployment request accepted!\n');
    console.log('📊 DEPLOYMENT RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Controller Address:     ', wallet.address);
    console.log('Controller Private Key: ', wallet.privateKey);
    console.log('Relayer Response:       ', JSON.stringify(responseData, null, 2));
    console.log('═══════════════════════════════════════════════════════');

    return {
      controllerAddress: wallet.address,
      controllerPrivateKey: wallet.privateKey,
      relayerResponse: responseData
    };
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  }
}

deployViaRelayer()
  .then((result) => {
    console.log('\n✨ Deployment request complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });