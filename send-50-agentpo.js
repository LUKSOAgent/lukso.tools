const { ethers } = require('ethers');

// Provider
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// My credentials
const controllerKey = '0xREDACTED_PRIVATE_KEY_1';
const myUP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const keyManager = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

// Recipient
const recipient = '0x50ea1f54fceede08962747c53d400607adddc84b';

// ABIs
const AGENTPO_ABI = [
  "function transfer(address from, address to, uint256 amount, bool allowNonLSP1Recipient, bytes memory data) public",
  "function balanceOf(address tokenOwner) public view returns (uint256)"
];

const UP_ABI = [
  "function execute(uint256 operation, address to, uint256 value, bytes memory data) public returns(bytes memory)"
];

const KM_ABI = [
  "function execute(bytes calldata payload) public payable returns(bytes memory)"
];

async function sendAGENTPO() {
  try {
    const wallet = new ethers.Wallet(controllerKey, provider);
    
    // Check my UP balance
    const agentpo = new ethers.Contract(AGENTPO, AGENTPO_ABI, wallet);
    const balance = await agentpo.balanceOf(myUP);
    console.log('My AGENTPO balance:', ethers.formatUnits(balance, 18));
    
    // Amount: 10,000 AGENTPO (18 decimals)
    const amount = ethers.parseUnits('10000', 18);
    console.log('Sending:', ethers.formatUnits(amount, 18), 'AGENTPO to', recipient);
    
    // Encode transfer: transfer(from, to, amount, allowNonLSP1Recipient, data)
    const transferCalldata = agentpo.interface.encodeFunctionData('transfer', [
      myUP,      // from
      recipient, // to
      amount,    // amount
      true,      // allowNonLSP1Recipient
      '0x'       // data
    ]);
    
    // Encode UP.execute
    const upInterface = new ethers.Interface(UP_ABI);
    const upCalldata = upInterface.encodeFunctionData('execute', [
      0,           // operation = CALL
      AGENTPO,     // to = AGENTPO contract
      0,           // value = 0
      transferCalldata
    ]);
    
    // Execute via KeyManager
    const keyManagerContract = new ethers.Contract(keyManager, KM_ABI, wallet);
    const tx = await keyManagerContract.execute(upCalldata);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Confirmed! Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch(e) {
    console.error('Error:', e.message);
    if(e.data) console.error('Revert data:', e.data);
  }
}

sendAGENTPO();
