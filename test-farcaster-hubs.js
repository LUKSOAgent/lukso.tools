const { ethers } = require('ethers');
const { getInsecureHubRpcClient, getSSLHubRpcClient } = require('@farcaster/hub-nodejs');
const { NobleEd25519Signer, makeCastAdd, FarcasterNetwork } = require('@farcaster/core');

const seedPhrase = 'warrior warfare describe cube grab doctor absurd extra burger alert credit slow';
const FID = 5218920;

const HUBS = [
  'hoyt.farcaster.xyz:2283',
  'nemes.farcaster.xyz:2281',
  'hub-grpc.pinata.cloud',
  'snapchain.fcstr.xyz:3383'
];

async function tryHub(hubAddress) {
  try {
    console.log('\nTrying hub:', hubAddress);
    
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    const client = getInsecureHubRpcClient(hubAddress);
    
    const privateKeyBytes = ethers.getBytes(wallet.privateKey).slice(0, 32);
    const signer = new NobleEd25519Signer(privateKeyBytes);
    
    const castAdd = await makeCastAdd(
      {
        text: "Testing Farcaster post from LUKSO agent! $LYX",
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
      const result = await client.submitMessage(castAdd.value);
      
      if (result.isOk()) {
        console.log('✅ SUCCESS with hub:', hubAddress);
        console.log('Result:', result.value);
        return true;
      } else {
        console.log('❌ Submit failed:', result.error.message);
      }
    } else {
      console.log('❌ Cast creation failed');
    }
    
  } catch(e) {
    console.log('❌ Error:', e.message);
  }
  return false;
}

async function main() {
  console.log('Testing Farcaster hubs...');
  console.log('FID:', FID);
  
  for (const hub of HUBS) {
    const success = await tryHub(hub);
    if (success) break;
  }
}

main();
