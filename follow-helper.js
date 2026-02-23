const { ethers } = require('ethers');
const { execSync } = require('child_process');

/**
 * Follow a Universal Profile via LSP26 using Key Manager
 * 
 * Pattern:
 * 1. Encode follow(address) call to LSP26 contract
 * 2. Encode UP.execute(0, LSP26, 0, followCalldata) 
 * 3. Send via KeyManager.execute(payload)
 */

function getCredentials() {
    try {
        // Decrypt credentials using sops
        const output = execSync('cd /root/.openclaw/workspace && sops --decrypt .credentials', { encoding: 'utf8' });
        return output;
    } catch (e) {
        console.error('Failed to decrypt credentials:', e.message);
        process.exit(1);
    }
}

async function followUniversalProfile(targetUP, name = 'Unknown') {
    // Load and decrypt credentials
    const creds = getCredentials();
    const pk = creds.split('\n').find(l => l.startsWith('Private Key:')).split(': ')[1].trim();
    
    const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
    const wallet = new ethers.Wallet(pk, provider);
    
    const km = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
    const up = '0x293E96ebbf264ed7715cff2b67850517De70232a';
    const lsp26 = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
    
    // Lowercase the target address
    const targetAddress = targetUP.toLowerCase();
    
    const kmABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
    const erc725xABI = ['function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
    const lsp26ABI = ['function follow(address profileToFollow) external'];
    
    const keyManager = new ethers.Contract(km, kmABI, wallet);
    const upContract = new ethers.Contract(up, erc725xABI);
    const follower = new ethers.Contract(lsp26, lsp26ABI);
    
    try {
        console.log(`Following ${name} (${targetAddress})...`);
        
        // Step 1: Encode follow(address) call
        const followCalldata = follower.interface.encodeFunctionData('follow', [targetAddress]);
        
        // Step 2: Encode UP.execute(0, lsp26, 0, followCalldata)
        const payload = upContract.interface.encodeFunctionData('execute', [0, lsp26, 0, followCalldata]);
        
        // Step 3: Send via KeyManager
        const tx = await keyManager.execute(payload, { gasLimit: 500000 });
        console.log('Tx sent:', tx.hash);
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log(`✅ Successfully followed ${name}!`);
            return { success: true, txHash: tx.hash };
        } else {
            console.log(`❌ Transaction failed for ${name}`);
            return { success: false, error: 'Transaction reverted' };
        }
    } catch(e) {
        console.log(`❌ Error following ${name}:`, e.message);
        return { success: false, error: e.message };
    }
}

// Export for use in other scripts
module.exports = { followUniversalProfile, getCredentials };

// If run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: node follow-helper.js <UP_ADDRESS> [NAME]');
        process.exit(1);
    }
    followUniversalProfile(args[0], args[1] || 'Unknown');
}