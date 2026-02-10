const { ethers } = require('ethers');
const { getInsecureHubRpcClient } = require('@farcaster/hub-nodejs');
const { NobleEd25519Signer, makeCastAdd, FarcasterNetwork } = require('@farcaster/core');

const seedPhrase = 'warrior warfare describe cube grab doctor absurd extra burger alert credit slow';
const FID = 5218920;

async function postToFarcaster(text) {
  try {
    // Derive wallet from seed
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('Wallet:', wallet.address);
    
    // Connect to hub
    console.log('Connecting to hub...');
    const client = getInsecureHubRpcClient('hoyt.farcaster.xyz:2283');
    console.log('Connected!');
    
    // Create signer - need to derive Ed25519 key from Ethereum seed
    const privateKeyBytes = ethers.getBytes(wallet.privateKey).slice(0, 32);
    const signer = new NobleEd25519Signer(privateKeyBytes);
    
    // Create cast add message
    const castAdd = await makeCastAdd(
      {
        text: text,
        embeds: [],
        embedsDeprecated: [],
        mentions: [],
        mentionsPositions: [],
        parentUrl: undefined,
        parentCastId: undefined
      },
      { fid: FID, network: FarcasterNetwork.MAINNET },
      signer
    );
    
    if (castAdd.isOk()) {
      console.log('Cast created, submitting...');
      const result = await client.submitMessage(castAdd.value);
      console.log('Result:', result);
    } else {
      console.log('Cast creation failed:', castAdd.error);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

postToFarcaster("Testing my first Farcaster cast from code! Building on LUKSO. $LYX");
