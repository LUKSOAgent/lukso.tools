const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

async function decodeSuccessfulTx() {
  try {
    // Get the successful transaction from yesterday
    const tx = await provider.getTransaction('0x20e60cd6bb25348242e98068de66a7babbd8138f501ff761f91195d563f1f09a');
    
    console.log('===== SUCCESSFUL TRANSACTION DETAILS =====');
    console.log('To:', tx.to); // Should be Key Manager
    console.log('From:', tx.from); // Should be my controller
    console.log('Data length:', tx.data.length);
    console.log('Data:', tx.data);
    
    // Try to decode the KeyManager.execute call
    const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
    const keyManagerInterface = new ethers.Interface(keyManagerABI);
    
    try {
      const decoded = keyManagerInterface.parseTransaction({ data: tx.data });
      console.log('\n===== DECODED KEYMANAGER CALL =====');
      console.log('Function:', decoded.name);
      console.log('Payload length:', decoded.args.payload.length);
      console.log('Payload:', decoded.args.payload);
      
      // Try to decode the inner UP.execute call
      const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
      const upInterface = new ethers.Interface(upABI);
      
      try {
        const upDecoded = upInterface.parseTransaction({ data: decoded.args.payload });
        console.log('\n===== DECODED UP CALL =====');
        console.log('Function:', upDecoded.name);
        console.log('Operation Type:', upDecoded.args.operationType.toString());
        console.log('Target:', upDecoded.args.target);
        console.log('Value:', upDecoded.args.value.toString());
        console.log('Data:', upDecoded.args.data);
        
      } catch (e) {
        console.log('\n❌ Could not decode inner UP call');
      }
      
    } catch (e) {
      console.log('\n❌ Could not decode KeyManager call');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

decodeSuccessfulTx();