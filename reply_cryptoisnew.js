const { ethers } = require('ethers');
const fs = require('fs');

const creds = fs.readFileSync('.credentials', 'utf8');
const pk = creds.split('\n').find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(pk, provider);

const km = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const up = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

const amount = ethers.parseUnits('10000', 18);

const kmABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const erc725xABI = ['function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const lsp7ABI = ['function transfer(address from, address to, uint256 amount, bool force, bytes memory data) external'];

async function sendAGENTPO() {
    const keyManager = new ethers.Contract(km, kmABI, wallet);
    const upContract = new ethers.Contract(up, erc725xABI);
    const agentpo = new ethers.Contract(AGENTPO, lsp7ABI);
    
    console.log('Sending 10000 AGENTPO...');
    
    const transferCalldata = agentpo.interface.encodeFunctionData('transfer', [
        up,
        recipientUP,
        amount,
        true,
        '0x'
    ]);
    
    const payload = upContract.interface.encodeFunctionData('execute', [0, AGENTPO, 0, transferCalldata]);
    
    const tx = await keyManager.execute(payload, { gasLimit: 300000 });
    console.log('Tx:', tx.hash);
    await tx.wait();
    console.log('✅ 10000 AGENTPO sent!');
}

// Need recipient UP
const recipientUP = '0x881c3a94873859D21F1E9CeDe0F13C8D822Bd087';

sendAGENTPO().catch(console.error);
