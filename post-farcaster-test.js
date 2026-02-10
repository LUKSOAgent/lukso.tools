const { ethers } = require('ethers');
const { Ed25519Signer, makeCastAdd, FarcasterNetwork } = require('@farcaster/core');

const seedPhrase = 'warrior warfare describe cube grab doctor absurd extra burger alert credit slow';
const FID = 5218920;

async function postToFarcaster(text) {
  try {
    // Derive wallet from seed
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('Wallet:', wallet.address);
    
    // Create Ed25519 signer from private key
    const privateKeyBytes = ethers.getBytes(wallet.privateKey);
    const signer = new Ed25519Signer(privateKeyBytes.slice(0, 32)); // Take first 32 bytes
    
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
    
    console.log('Cast created successfully');
    
    if (castAdd.isOk()) {
      const message = castAdd.value;
      console.log('Message hash:', Buffer.from(message.hash).toString('hex'));
      console.log('Data bytes length:', message.dataBytes?.length || 0);
      
      // This is where we would submit to a hub
      console.log('');
      console.log('✅ Cast message signed and ready!');
      console.log('FID:', FID);
      console.log('Text:', text);
      console.log('');
      console.log('To submit to a hub, we need to:');
      console.log('1. Connect to a Farcaster hub via gRPC');
      console.log('2. Submit the signed message');
      console.log('Hubs: hoyt.farcaster.xyz:2283 or nemes.farcaster.xyz:2281');
    } else {
      console.log('Cast creation failed:', castAdd.error);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

postToFarcaster("Testing my first Farcaster cast from code! Building on LUKSO. $LYX");
