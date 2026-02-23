const solc = require('solc');
const { ethers } = require('ethers');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  // 1. Read contract source
  const source = fs.readFileSync('./AgentSkillsRegistry.sol', 'utf8');

  // 2. Compile
  console.log('Compiling AgentSkillsRegistry.sol...');
  const input = {
    language: 'Solidity',
    sources: { 'AgentSkillsRegistry.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] } }
    }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errs = output.errors.filter(e => e.severity === 'error');
    if (errs.length > 0) {
      console.error('Compilation errors:', JSON.stringify(errs, null, 2));
      process.exit(1);
    }
    output.errors.forEach(w => console.warn('Warning:', w.formattedMessage));
  }

  const contract = output.contracts['AgentSkillsRegistry.sol']['AgentSkillsRegistry'];
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;

  console.log('✅ Compiled successfully');
  console.log('Bytecode size:', bytecode.length / 2 - 1, 'bytes');

  // Save ABI
  fs.writeFileSync('./AgentSkillsRegistry.abi.json', JSON.stringify(abi, null, 2));

  // 3. Get credentials
  console.log('\nDecrypting credentials...');
  const creds = execSync('cd /root/.openclaw/workspace && sops --decrypt .credentials', { encoding: 'utf8' });

  // Extract controller private key
  const pkMatch = creds.match(/Controller Private Key[:\s]+([0-9a-fA-F]{64})/);
  if (!pkMatch) {
    // Try alternative format
    const altMatch = creds.match(/Private Key[:\s]+(0x[0-9a-fA-F]{64}|[0-9a-fA-F]{64})/);
    if (!altMatch) {
      console.error('Could not find private key in credentials');
      // Print lines with "key" for debugging (no values)
      const lines = creds.split('\n').filter(l => l.toLowerCase().includes('key'));
      console.log('Key-related lines found:', lines.map(l => l.split(':')[0]));
      process.exit(1);
    }
    var pk = altMatch[1].startsWith('0x') ? altMatch[1] : '0x' + altMatch[1];
  } else {
    var pk = pkMatch[1].startsWith('0x') ? pkMatch[1] : '0x' + pkMatch[1];
  }

  // 4. Connect to LUKSO mainnet
  const provider = new ethers.JsonRpcProvider('https://42.rpc.thirdweb.com');
  const wallet = new ethers.Wallet(pk, provider);

  console.log('Deploying from:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'LYX');

  // 5. Deploy
  console.log('\nDeploying to LUKSO mainnet (chain 42)...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.deploy({ gasLimit: 3_000_000 });

  console.log('Deploy tx hash:', deployTx.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');

  const receipt = await deployTx.waitForDeployment();
  const address = await deployTx.getAddress();

  console.log('\n✅ Deployed!');
  console.log('Contract address:', address);
  console.log('Explorer:', `https://explorer.lukso.network/address/${address}`);

  // Save deployment info
  const deployInfo = {
    contractAddress: address,
    deployTxHash: deployTx.deploymentTransaction().hash,
    deployer: wallet.address,
    network: 'LUKSO mainnet (42)',
    deployedAt: new Date().toISOString(),
    solcVersion: solc.version(),
    optimizer: { enabled: true, runs: 200 }
  };
  fs.writeFileSync('./deployment.json', JSON.stringify(deployInfo, null, 2));
  console.log('\nDeployment info saved to deployment.json');

  // 6. Quick smoke test
  console.log('\nSmoke test...');
  const deployed = new ethers.Contract(address, abi, provider);
  const skillKey = await deployed.skillKeyFor('test');
  console.log('skillKeyFor("test"):', skillKey);
  console.log('✅ Contract responding correctly');

  return deployInfo;
}

main().catch(e => { console.error(e); process.exit(1); });
