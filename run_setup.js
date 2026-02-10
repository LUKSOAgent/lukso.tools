const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const POTATO_TOKEN = '0x2b2ea1416d63abf7e3c3657f03806f015625524b';

// Retry logic
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`Attempt ${i + 1} failed:`, e.message);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function execute() {
  // Use alternative RPC
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Controller:', wallet.address);
  
  // KeyManager
  const keyManagerAbi = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
  const keyManager = new ethers.Contract(KEY_MANAGER, keyManagerAbi, wallet);
  
  // Step 1: Set data keys
  console.log('\n📝 Executing Step 1: Set Data Keys...');
  const setDataPayload = '0x97902421000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030cfc51aec37c55a4d0b1000071e02f9f05bcd5816ec4f3134aa2e5a9166695370cfc51aec37c55a4d0b100009d3c0b4012b69658977b099bdaa51eff0f0460f4d1d57abed02d4c2d7ce00000e8211998bb257be214c7b0997830cd295066cc6a0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000145eed04004c2d46c12fe30c639a90ad5d6f5d573d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000145eed04004c2d46c12fe30c639a90ad5d6f5d573d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000008ac7230489e80000';
  
  try {
    const tx1 = await withRetry(async () => {
      return await keyManager.execute(setDataPayload);
    });
    console.log('✅ Step 1 TX:', tx1.hash);
    await tx1.wait();
    console.log('✅ Step 1 confirmed');
  } catch (e) {
    console.error('❌ Step 1 failed:', e.message);
    return;
  }
  
  // Step 2: Authorize operator
  console.log('\n📝 Executing Step 2: Authorize PotatoTipper...');
  const authPayload = '0xb49506fd0000000000000000000000005eed04004c2d46c12fe30c639a90ad5d6f5d573d00000000000000000000000000000000000000000000001b1ae4d6e2ef50000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000';
  
  try {
    const tx2 = await withRetry(async () => {
      return await keyManager.execute(authPayload);
    });
    console.log('✅ Step 2 TX:', tx2.hash);
    await tx2.wait();
    console.log('✅ Step 2 confirmed');
  } catch (e) {
    console.error('❌ Step 2 failed:', e.message);
    return;
  }
  
  console.log('\n🥔 POTATO TIPPER SETUP COMPLETE!');
}

execute().catch(console.error);