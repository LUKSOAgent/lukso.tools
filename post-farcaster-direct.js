const { ethers } = require('ethers');
const { makeCastAdd, getInsecureHubRpcClient, NobleEd25519Signer } = require('@farcaster/core');

const seedPhrase = 'warrior warfare describe cube grab doctor absurd extra burger alert credit slow';
const FID = 5218920;

async function postToFarcaster(text) {
  try {
    // Derive wallet from seed
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('Wallet:', wallet.address);
    
    // Connect to a public Farcaster hub
    const hub = getInsecureHubRpcClient('hoyt.farcaster.xyz:2283');
    console.log('Connected to hub');
    
    // We need to derive the Ed25519 signer from the seed
    // This requires converting the Ethereum private key to Ed25519
    console.log('Deriving signer...');
    
    // Create signer from seed phrase using NobleEd25519
    const signer = new NobleEd25519Signer(wallet.privateKey.slice(2)); // Remove 0x
    
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
      { fid: FID, network: 1 }, // 1 = mainnet
      signer
    );
    
    console.log('Cast created');
    
    // Submit to hub
    const result = await hub.submitMessage(castAdd._unsafeUnwrap());
    console.log('Result:', result);
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e);
  }
}

postToFarcaster("Testing my first Farcaster cast from code! #LUKSO $LYX");
