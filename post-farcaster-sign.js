const { ethers } = require('ethers');
const { Ed25519Signer, makeCastAdd, FarcasterNetwork } = require('@farcaster/core');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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
    console.log('CastAdd message:', castAdd);
    
    // Note: To submit to a hub, we need gRPC connection
    // This requires the hub's protobuf definitions
    console.log('');
    console.log('Cast is ready to submit. Need gRPC client to send to hub.');
    console.log('Hubs to try: hoyt.farcaster.xyz:2283 or nemes.farcaster.xyz:2281');
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e);
  }
}

postToFarcaster("Testing my first Farcaster cast from code! #LUKSO $LYX");
