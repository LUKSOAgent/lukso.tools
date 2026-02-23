/**
 * LSP6 Shared UP / Mini-DAO Implementation Guide
 * 
 * This file demonstrates the actual implementation patterns for working
 * with LSP6 KeyManager and Universal Profiles.
 */

import { ethers } from "hardhat";

// ============================================
// SECTION 1: Contract ABIs (Simplified)
// ============================================

const LSP0_ABI = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function execute(uint256 operation, address to, uint256 value, bytes data) payable",
  "function executeBatch(uint256[] operations, address[] targets, uint256[] values, bytes[] datas)",
  "function setData(bytes32 key, bytes value)",
  "function getData(bytes32 key) view returns (bytes)",
];

const LSP6_ABI = [
  "function execute(bytes payload)",
  "function executeRelayCall(bytes signature, uint256 nonce, bytes payload) payable",
  "function getNonce(address signer, uint256 channel) view returns (uint256)",
  "function getPermissions(address controller) view returns (bytes32)",
];

// ============================================
// SECTION 2: Deployment Functions
// ============================================

/**
 * Deploy a complete Shared Universal Profile setup
 * @param deployer - The deploying signer
 * @returns Object containing UP and KeyManager addresses
 */
export async function deploySharedUP(deployer: any) {
  console.log("Deploying Shared Universal Profile...\n");

  // Deploy Universal Profile (ERC725Account)
  const LSP0Factory = await ethers.getContractFactory("LSP0ERC725Account", deployer);
  const universalProfile = await LSP0Factory.deploy(await deployer.getAddress());
  await universalProfile.waitForDeployment();
  
  const upAddress = await universalProfile.getAddress();
  console.log(`✅ Universal Profile deployed: ${upAddress}`);

  // Deploy KeyManager
  const LSP6Factory = await ethers.getContractFactory("LSP6KeyManager", deployer);
  const keyManager = await LSP6Factory.deploy(upAddress);
  await keyManager.waitForDeployment();
  
  const kmAddress = await keyManager.getAddress();
  console.log(`✅ KeyManager deployed: ${kmAddress}`);

  // Transfer ownership to KeyManager
  const transferTx = await universalProfile.transferOwnership(kmAddress);
  await transferTx.wait();
  console.log(`✅ Ownership transferred to KeyManager\n`);

  return { universalProfile, keyManager, upAddress, kmAddress };
}

// ============================================
// SECTION 3: Controller Management
// ============================================

/**
 * Set permissions for a controller
 * @param keyManager - The KeyManager contract
 * @param controllerAddress - Address of the controller
 * @param permissions - Permission bitmask
 * @param adminSigner - Signer with admin permissions
 */
export async function setControllerPermissions(
  keyManager: any,
  universalProfile: any,
  controllerAddress: string,
  permissions: string,
  adminSigner: any
) {
  // Generate permission key for the controller
  const permissionKey = getPermissionKey(controllerAddress);
  
  // Encode the permission data
  const permissionData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32"],
    [permissions]
  );

  // Create the payload to set data on the UP
  const payload = universalProfile.interface.encodeFunctionData("setData", [
    permissionKey,
    permissionData
  ]);

  // Execute through KeyManager
  const tx = await keyManager.connect(adminSigner).execute(payload);
  await tx.wait();

  console.log(`✅ Set permissions for ${controllerAddress}`);
  console.log(`   Key: ${permissionKey}`);
  console.log(`   Permissions: ${permissions}\n`);
}

/**
 * Remove a controller by setting their permissions to 0
 */
export async function removeController(
  keyManager: any,
  universalProfile: any,
  controllerAddress: string,
  adminSigner: any
) {
  await setControllerPermissions(
    keyManager,
    universalProfile,
    controllerAddress,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    adminSigner
  );
  console.log(`✅ Controller ${controllerAddress} removed`);
}

// ============================================
// SECTION 4: Transaction Execution
// ============================================

/**
 * Execute a single transaction through the KeyManager
 */
export async function executeThroughKeyManager(
  keyManager: any,
  universalProfile: any,
  operation: number, // 0 = CALL, 1 = CREATE, etc.
  target: string,
  value: bigint,
  data: string,
  controllerSigner: any
) {
  // Encode the execute call
  const payload = universalProfile.interface.encodeFunctionData("execute", [
    operation,
    target,
    value,
    data
  ]);

  // Execute through KeyManager
  const tx = await keyManager.connect(controllerSigner).execute(payload);
  const receipt = await tx.wait();

  console.log(`✅ Transaction executed`);
  console.log(`   Hash: ${receipt.hash}`);
  console.log(`   Gas used: ${receipt.gasUsed}\n`);

  return receipt;
}

/**
 * Execute a batch of transactions
 */
export async function executeBatch(
  keyManager: any,
  universalProfile: any,
  operations: number[],
  targets: string[],
  values: bigint[],
  datas: string[],
  controllerSigner: any
) {
  // Encode the batch call
  const payload = universalProfile.interface.encodeFunctionData("executeBatch", [
    operations,
    targets,
    values,
    datas
  ]);

  // Execute through KeyManager
  const tx = await keyManager.connect(controllerSigner).execute(payload);
  const receipt = await tx.wait();

  console.log(`✅ Batch transaction executed`);
  console.log(`   Hash: ${receipt.hash}`);
  console.log(`   Operations: ${operations.length}`);
  console.log(`   Gas used: ${receipt.gasUsed}\n`);

  return receipt;
}

// ============================================
// SECTION 5: Relay Call Pattern
// ============================================

/**
 * Create and execute a relay call
 * This allows gasless transactions where a relayer pays the gas
 */
export async function executeRelayCall(
  keyManager: any,
  universalProfile: any,
  operation: number,
  target: string,
  value: bigint,
  data: string,
  controllerWallet: any, // The actual controller signing
  relayerSigner: any     // The relayer paying gas
) {
  // Get the nonce for this controller
  const nonce = await keyManager.getNonce(controllerWallet.address, 0);

  // Encode the payload
  const payload = universalProfile.interface.encodeFunctionData("execute", [
    operation,
    target,
    value,
    data
  ]);

  // Create the message to sign
  const kmAddress = await keyManager.getAddress();
  const message = ethers.keccak256(
    ethers.solidityPacked(
      ["address", "uint256", "bytes"],
      [kmAddress, nonce, payload]
    )
  );

  // Sign the message
  const signature = await controllerWallet.signMessage(ethers.getBytes(message));

  // Execute via relayer
  const tx = await keyManager.connect(relayerSigner).executeRelayCall(
    signature,
    nonce,
    payload,
    { value: 0 }
  );
  
  const receipt = await tx.wait();

  console.log(`✅ Relay call executed`);
  console.log(`   Controller: ${controllerWallet.address}`);
  console.log(`   Relayer: ${await relayerSigner.getAddress()}`);
  console.log(`   Hash: ${receipt.hash}\n`);

  return receipt;
}

// ============================================
// SECTION 6: Permission Verification
// ============================================

/**
 * Verify controller permissions
 */
export async function verifyPermissions(
  universalProfile: any,
  controllerAddress: string,
  expectedPermissions: string
): Promise<boolean> {
  const permissionKey = getPermissionKey(controllerAddress);
  const storedData = await universalProfile.getData(permissionKey);
  
  // Decode the stored permissions
  const storedPermissions = ethers.AbiCoder.defaultAbiCoder().decode(
    ["bytes32"],
    storedData
  )[0];

  const matches = storedPermissions.toLowerCase() === expectedPermissions.toLowerCase();

  console.log(`Verification for ${controllerAddress}:`);
  console.log(`   Expected: ${expectedPermissions}`);
  console.log(`   Stored:   ${storedPermissions}`);
  console.log(`   Match:    ${matches ? "✅ YES" : "❌ NO"}\n`);

  return matches;
}

// ============================================
// SECTION 7: Helper Functions
// ============================================

function getPermissionKey(address: string): string {
  const LSP6_KEY_PREFIX = "0x4b80742d00000000c6dd0000";
  const cleanAddress = address.toLowerCase().replace("0x", "");
  return `${LSP6_KEY_PREFIX}${cleanAddress}`;
}

// ============================================
// SECTION 8: Example Usage
// ============================================

/**
 * Example: Setting up a complete mini-DAO
 */
export async function exampleMiniDAOSetup() {
  const [deployer, controller1, controller2, controller3] = await ethers.getSigners();

  // Deploy shared UP
  const { universalProfile, keyManager } = await deploySharedUP(deployer);

  // Set up controllers with different permissions
  const PERMISSIONS = {
    EXECUTE: "0x0000000000000000000000000000000000000000000000000000000000000300",
    SETDATA: "0x0000000000000000000000000000000000000000000000000000000000030000",
    SIGN: "0x0000000000000000000000000000000000000000000000000000000000040000",
  };

  await setControllerPermissions(
    keyManager, universalProfile, 
    await controller1.getAddress(), 
    PERMISSIONS.EXECUTE, 
    deployer
  );
  
  await setControllerPermissions(
    keyManager, universalProfile, 
    await controller2.getAddress(), 
    PERMISSIONS.SETDATA, 
    deployer
  );
  
  await setControllerPermissions(
    keyManager, universalProfile, 
    await controller3.getAddress(), 
    PERMISSIONS.SIGN, 
    deployer
  );

  console.log("✅ Mini-DAO setup complete!");
  console.log("   Controller 1: Execute permissions");
  console.log("   Controller 2: SetData permissions");
  console.log("   Controller 3: Sign permissions");
}
