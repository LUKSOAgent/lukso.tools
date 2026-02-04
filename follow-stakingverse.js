const { ethers } = require('ethers');
const fs = require('fs');

const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function followBatch(address[] calldata profilesToFollow) external'];

const stakingverseUP = '0x900be67854a47282211844bbdf5cc0f332620513';

async function followStakingverse() {
  try {
    console.log('Following Stakingverse...');
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    const followCalldata = followerContract.interface.encodeFunctionData('followBatch', [[stakingverseUP]]);
    
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0,
      followerSystemAddress,
      0,
      followCalldata
    ]);
    
    const tx = await keyManager.execute(upExecuteCalldata, { gasLimit: 300000 });
    console.log('✅ Follow tx:', tx.hash);
    await tx.wait();
    console.log('✅ Stakingverse followed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

followStakingverse();