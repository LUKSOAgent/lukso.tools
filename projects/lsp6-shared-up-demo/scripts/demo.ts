/**
 * LSP6 Shared UP / Mini-DAO Demo
 * 
 * This script demonstrates a shared Universal Profile with multiple controllers,
 * each having different permission levels. This creates a mini-DAO structure
 * where OpenClaw sub-agents can act as controllers with granular permissions.
 */

import { ethers } from "hardhat";
import { Contract, Signer, BigNumberish } from "ethers";

// LSP6 Permission Bitmasks
const PERMISSIONS = {
  // Basic permissions
  CHANGE_OWNER: "0x0000000000000000000000000000000000000000000000000000000000000001",
  ADD_CONTROLLER: "0x0000000000000000000000000000000000000000000000000000000000000002",
  EDIT_PERMISSIONS: "0x0000000000000000000000000000000000000000000000000000000000000004",
  ADD_EXTENSION: "0x0000000000000000000000000000000000000000000000000000000000000008",
  CHANGE_EXTENSION: "0x0000000000000000000000000000000000000000000000000000000000000010",
  
  // Execution permissions
  EXECUTE: "0x0000000000000000000000000000000000000000000000000000000000000100",
  EXECUTE_CALL: "0x0000000000000000000000000000000000000000000000000000000000000200",
  
  // Data permissions
  SETDATA: "0x0000000000000000000000000000000000000000000000000000000000000400",
  SUPER_SETDATA: "0x0000000000000000000000000000000000000000000000000000000000000800",
  
  // Signature permissions
  SIGN: "0x0000000000000000000000000000000000000000000000000000000000001000",
  
  // Batch permissions
  BATCH_CALLS: "0x0000000000000000000000000000000000000000000000000000000000002000",
  
  // Combined permissions for different roles
  ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000fff",
  EXECUTOR: "0x0000000000000000000000000000000000000000000000000000000000000300", // EXECUTE + EXECUTE_CALL
  DATA_MANAGER: "0x0000000000000000000000000000000000000000000000000000000000000c00", // SETDATA + SUPER_SETDATA
  SIGNER: "0x0000000000000000000000000000000000000000000000000000000000001000", // SIGN only
  LIMITED_EXECUTOR: "0x0000000000000000000000000000000000000000000000000000000000000100", // EXECUTE only
};

// LSP6 KeyManager permission key prefix
const LSP6_PERMISSION_KEY_PREFIX = "0x4b80742d00000000c6dd0000";

interface Controller {
  name: string;
  signer: Signer;
  address: string;
  permissions: string;
  role: string;
}

class LSP6SharedUPDemo {
  private deployer: Signer;
  private universalProfile: Contract;
  private keyManager: Contract;
  private controllers: Controller[] = [];

  constructor(deployer: Signer) {
    this.deployer = deployer;
  }

  /**
   * Deploy a new Universal Profile with KeyManager
   */
  async deploySharedUP(): Promise<void> {
    console.log("\n🚀 ===========================================");
    console.log("   DEPLOYING SHARED UNIVERSAL PROFILE");
    console.log("   ===========================================\n");

    const deployerAddress = await this.deployer.getAddress();
    console.log(`📋 Deployer: ${deployerAddress}`);

    // Deploy Universal Profile
    console.log("\n📦 Deploying Universal Profile...");
    const LSP0ERC725Account = await ethers.getContractFactory("LSP0ERC725Account", this.deployer);
    this.universalProfile = await LSP0ERC725Account.deploy(deployerAddress);
    await this.universalProfile.deployed();
    console.log(`✅ Universal Profile deployed at: ${this.universalProfile.address}`);

    // Deploy KeyManager
    console.log("\n🔐 Deploying LSP6 KeyManager...");
    const LSP6KeyManager = await ethers.getContractFactory("LSP6KeyManager", this.deployer);
    this.keyManager = await LSP6KeyManager.deploy(this.universalProfile.address);
    await this.keyManager.deployed();
    console.log(`✅ KeyManager deployed at: ${this.keyManager.address}`);

    // Transfer ownership of UP to KeyManager
    console.log("\n🔄 Transferring UP ownership to KeyManager...");
    const transferTx = await this.universalProfile.connect(this.deployer).transferOwnership(this.keyManager.address);
    await transferTx.wait();
    console.log("✅ Ownership transferred to KeyManager");

    console.log("\n📊 Deployment Summary:");
    console.log(`   Universal Profile: ${this.universalProfile.address}`);
    console.log(`   KeyManager:        ${this.keyManager.address}`);
    console.log(`   Owner:             ${await this.universalProfile.owner()}`);
  }

  /**
   * Create 3 controller EOAs with different permission levels
   */
  async createControllers(): Promise<void> {
    console.log("\n👥 ===========================================");
    console.log("   CREATING CONTROLLERS (Mini-DAO Members)");
    console.log("   ===========================================\n");

    // Create 3 EOAs with different permission levels
    const controller1Wallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const controller2Wallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const controller3Wallet = ethers.Wallet.createRandom().connect(ethers.provider);

    // Fund the wallets
    console.log("💰 Funding controller wallets...");
    await (await this.deployer.sendTransaction({
      to: controller1Wallet.address,
      value: ethers.utils.parseEther("1.0")
    })).wait();
    await (await this.deployer.sendTransaction({
      to: controller2Wallet.address,
      value: ethers.utils.parseEther("1.0")
    })).wait();
    await (await this.deployer.sendTransaction({
      to: controller3Wallet.address,
      value: ethers.utils.parseEther("1.0")
    })).wait();

    this.controllers = [
      {
        name: "Agent Alpha (Executor)",
        signer: controller1Wallet,
        address: controller1Wallet.address,
        permissions: PERMISSIONS.EXECUTOR,
        role: "Can execute transactions and calls"
      },
      {
        name: "Agent Beta (Data Manager)",
        signer: controller2Wallet,
        address: controller2Wallet.address,
        permissions: PERMISSIONS.DATA_MANAGER,
        role: "Can set data on the UP"
      },
      {
        name: "Agent Gamma (Signer)",
        signer: controller3Wallet,
        address: controller3Wallet.address,
        permissions: PERMISSIONS.SIGNER,
        role: "Can sign messages on behalf of UP"
      }
    ];

    console.log("\n📋 Controllers Created:");
    for (const controller of this.controllers) {
      console.log(`\n   👤 ${controller.name}`);
      console.log(`      Address:    ${controller.address}`);
      console.log(`      Role:       ${controller.role}`);
      console.log(`      Permission: ${controller.permissions}`);
    }
  }

  /**
   * Set permissions for each controller on the KeyManager
   */
  async setControllerPermissions(): Promise<void> {
    console.log("\n🔐 ===========================================");
    console.log("   SETTING CONTROLLER PERMISSIONS");
    console.log("   ===========================================\n");

    // First, set the deployer as a controller with admin permissions
    const deployerAddress = await this.deployer.getAddress();
    const deployerKey = this.getPermissionKey(deployerAddress);
    
    console.log(`🔑 Setting deployer as admin controller...`);
    const deployerData = ethers.utils.defaultAbiCoder.encode(["bytes32"], [PERMISSIONS.ADMIN]);
    
    // Encode the transaction through KeyManager
    const setDataPayload = this.universalProfile.interface.encodeFunctionData("setData", [deployerKey, deployerData]);
    const executeTx = await this.keyManager.connect(this.deployer).execute(setDataPayload);
    await executeTx.wait();
    console.log(`✅ Deployer permissions set: ${PERMISSIONS.ADMIN}`);

    // Set permissions for each controller
    for (const controller of this.controllers) {
      console.log(`\n🔑 Setting permissions for ${controller.name}...`);
      
      const permissionKey = this.getPermissionKey(controller.address);
      const permissionData = ethers.utils.defaultAbiCoder.encode(["bytes32"], [controller.permissions]);
      
      const payload = this.universalProfile.interface.encodeFunctionData("setData", [permissionKey, permissionData]);
      const tx = await this.keyManager.connect(this.deployer).execute(payload);
      await tx.wait();
      
      console.log(`✅ Permissions set: ${controller.permissions}`);
      console.log(`   Key: ${permissionKey}`);
    }

    console.log("\n📊 All permissions configured successfully!");
  }

  /**
   * Verify permissions for each controller
   */
  async verifyPermissions(): Promise<void> {
    console.log("\n✅ ===========================================");
    console.log("   VERIFYING CONTROLLER PERMISSIONS");
    console.log("   ===========================================\n");

    for (const controller of this.controllers) {
      const permissionKey = this.getPermissionKey(controller.address);
      const storedPermissions = await this.universalProfile.getData(permissionKey);
      
      console.log(`\n👤 ${controller.name}`);
      console.log(`   Address:           ${controller.address}`);
      console.log(`   Expected:          ${controller.permissions}`);
      console.log(`   Stored:            ${storedPermissions}`);
      console.log(`   Verification:      ${storedPermissions.toLowerCase() === controller.permissions.toLowerCase() ? "✅ MATCH" : "❌ MISMATCH"}`);
    }
  }

  /**
   * Demonstrate batch transactions through the shared account
   */
  async demonstrateBatchTransactions(): Promise<void> {
    console.log("\n📦 ===========================================");
    console.log("   BATCH TRANSACTIONS DEMO");
    console.log("   ===========================================\n");

    // Get the executor controller (Agent Alpha)
    const executor = this.controllers.find(c => c.name.includes("Executor"));
    if (!executor) {
      console.log("❌ Executor controller not found");
      return;
    }

    console.log(`🎯 Executing as: ${executor.name}`);
    console.log(`   Address: ${executor.address}\n`);

    // Create batch calls
    const recipient1 = ethers.Wallet.createRandom().address;
    const recipient2 = ethers.Wallet.createRandom().address;
    
    console.log("📋 Batch Transaction Plan:");
    console.log(`   1. Send 0.1 ETH to ${recipient1.substring(0, 20)}...`);
    console.log(`   2. Send 0.1 ETH to ${recipient2.substring(0, 20)}...`);
    console.log(`   3. Set data key "batch-demo-key" = "batch-demo-value"\n`);

    // First, fund the UP with some ETH
    console.log("💰 Funding Universal Profile...");
    await (await this.deployer.sendTransaction({
      to: this.universalProfile.address,
      value: ethers.utils.parseEther("2.0")
    })).wait();
    console.log(`✅ UP funded with 2.0 ETH`);
    console.log(`   Balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.universalProfile.address))} ETH\n`);

    // Encode batch calls
    const operations = [0, 0, 0]; // 0 = CALL
    const targets = [recipient1, recipient2, this.universalProfile.address];
    const values = [
      ethers.utils.parseEther("0.1"),
      ethers.utils.parseEther("0.1"),
      0
    ];
    
    const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("batch-demo-key"));
    const dataValue = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("batch-demo-value"));
    
    const datas = [
      "0x",
      "0x",
      this.universalProfile.interface.encodeFunctionData("setData", [dataKey, dataValue])
    ];

    // Execute batch via KeyManager
    console.log("🚀 Executing batch transaction...");
    const batchPayload = this.universalProfile.interface.encodeFunctionData("executeBatch", [operations, targets, values, datas]);
    
    try {
      const tx = await this.keyManager.connect(executor.signer).execute(batchPayload);
      const receipt = await tx.wait();
      
      console.log(`✅ Batch transaction executed!`);
      console.log(`   Transaction hash: ${receipt.transactionHash}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   Block number: ${receipt.blockNumber}\n`);
      
      // Verify results
      console.log("📊 Transaction Results:");
      console.log(`   Recipient 1 balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(recipient1))} ETH`);
      console.log(`   Recipient 2 balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(recipient2))} ETH`);
      console.log(`   UP balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.universalProfile.address))} ETH`);
      
      const storedValue = await this.universalProfile.getData(dataKey);
      console.log(`   Stored data: ${storedValue === dataValue ? "✅ CORRECT" : "❌ INCORRECT"}`);
      
    } catch (error: any) {
      console.log(`❌ Batch transaction failed: ${error.message}`);
    }
  }

  /**
   * Demonstrate executeRelayCall pattern
   */
  async demonstrateRelayCall(): Promise<void> {
    console.log("\n🔄 ===========================================");
    console.log("   EXECUTE RELAY CALL PATTERN");
    console.log("   ===========================================\n");

    const executor = this.controllers.find(c => c.name.includes("Executor"));
    if (!executor) {
      console.log("❌ Executor controller not found");
      return;
    }

    console.log("📋 Relay Call Pattern Demo:");
    console.log("   This demonstrates how a relayer can execute transactions");
    console.log("   on behalf of a controller without the controller paying gas.\n");

    // Create a simple transaction payload
    const recipient = ethers.Wallet.createRandom().address;
    const value = ethers.utils.parseEther("0.05");
    
    console.log(`🎯 Transaction: Send 0.05 ETH to ${recipient.substring(0, 20)}...`);

    // Encode the execute call
    const executePayload = this.universalProfile.interface.encodeFunctionData("execute", [
      0, // OPERATION_CALL
      recipient,
      value,
      "0x" // empty data
    ]);

    // Get the nonce for the executor
    const nonce = await this.keyManager.getNonce(executor.address, 0);
    console.log(`🔢 Nonce for ${executor.name}: ${nonce}`);

    // Create the relay call data
    // Format: <keyManagerAddress><nonce><payload>
    const encodedMessage = ethers.utils.solidityPack(
      ["address", "uint256", "bytes"],
      [this.keyManager.address, nonce, executePayload]
    );
    
    const messageHash = ethers.utils.keccak256(encodedMessage);
    console.log(`📝 Message hash: ${messageHash.substring(0, 30)}...`);

    // Sign the message with the executor's key
    const signature = await executor.signer.signMessage(ethers.utils.arrayify(messageHash));
    console.log(`✍️  Signature created: ${signature.substring(0, 40)}...\n`);

    // Execute the relay call (using deployer as relayer)
    console.log("🚀 Executing relay call via relayer (deployer)...");
    try {
      const relayTx = await this.keyManager.connect(this.deployer).executeRelayCall(
        signature,
        nonce,
        executePayload,
        { value: 0 }
      );
      const receipt = await relayTx.wait();
      
      console.log(`✅ Relay call executed successfully!`);
      console.log(`   Transaction hash: ${receipt.transactionHash}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   Recipient received: ${ethers.utils.formatEther(await ethers.provider.getBalance(recipient))} ETH`);
    } catch (error: any) {
      console.log(`❌ Relay call failed: ${error.message}`);
      console.log(`   Note: This may fail in local testing without proper signature verification`);
    }
  }

  /**
   * Demonstrate controller management (adding/removing)
   */
  async demonstrateControllerManagement(): Promise<void> {
    console.log("\n🔧 ===========================================");
    console.log("   CONTROLLER MANAGEMENT");
    console.log("   ===========================================\n");

    console.log("📋 Adding a new controller...\n");

    // Create a new controller
    const newControllerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    await (await this.deployer.sendTransaction({
      to: newControllerWallet.address,
      value: ethers.utils.parseEther("0.5")
    })).wait();

    console.log(`👤 New Controller: Agent Delta (Limited)`);
    console.log(`   Address: ${newControllerWallet.address}`);
    console.log(`   Role: Limited executor (EXECUTE only)`);

    // Add the new controller with limited permissions
    const permissionKey = this.getPermissionKey(newControllerWallet.address);
    const permissionData = ethers.utils.defaultAbiCoder.encode(["bytes32"], [PERMISSIONS.LIMITED_EXECUTOR]);
    
    const payload = this.universalProfile.interface.encodeFunctionData("setData", [permissionKey, permissionData]);
    const tx = await this.keyManager.connect(this.deployer).execute(payload);
    await tx.wait();

    console.log(`✅ New controller added with LIMITED_EXECUTOR permissions\n`);

    // Verify the new controller
    const storedPermissions = await this.universalProfile.getData(permissionKey);
    console.log(`📊 Verification:`);
    console.log(`   Stored permissions: ${storedPermissions}`);
    console.log(`   Expected:           ${PERMISSIONS.LIMITED_EXECUTOR}`);
    console.log(`   Match:              ${storedPermissions.toLowerCase() === PERMISSIONS.LIMITED_EXECUTOR.toLowerCase() ? "✅ YES" : "❌ NO"}\n`);

    // List all controllers
    console.log("📋 Controller List:");
    console.log(`   1. Deployer (Admin)`);
    console.log(`      ${await this.deployer.getAddress()}`);
    
    for (let i = 0; i < this.controllers.length; i++) {
      console.log(`   ${i + 2}. ${this.controllers[i].name}`);
      console.log(`      ${this.controllers[i].address}`);
    }
    
    console.log(`   ${this.controllers.length + 2}. Agent Delta (Limited)`);
    console.log(`      ${newControllerWallet.address}`);
  }

  /**
   * Get the permission key for an address
   */
  private getPermissionKey(address: string): string {
    // LSP6 permission key format: 0x4b80742d00000000c6dd0000<address>
    const cleanAddress = address.toLowerCase().replace("0x", "");
    return `${LSP6_PERMISSION_KEY_PREFIX}${cleanAddress}`;
  }

  /**
   * Get contract addresses for reference
   */
  getContractInfo(): { universalProfile: string; keyManager: string } {
    return {
      universalProfile: this.universalProfile?.address || "Not deployed",
      keyManager: this.keyManager?.address || "Not deployed"
    };
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     LSP6 SHARED UNIVERSAL PROFILE / MINI-DAO DEMO          ║");
  console.log("║                                                            ║");
  console.log("║  Demonstrates multiple EOAs as controllers with granular   ║");
  console.log("║  permissions for a shared Universal Profile                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const [deployer] = await ethers.getSigners();
  const demo = new LSP6SharedUPDemo(deployer);

  try {
    // Step 1: Deploy shared UP
    await demo.deploySharedUP();

    // Step 2: Create controllers
    await demo.createControllers();

    // Step 3: Set permissions
    await demo.setControllerPermissions();

    // Step 4: Verify permissions
    await demo.verifyPermissions();

    // Step 5: Demonstrate batch transactions
    await demo.demonstrateBatchTransactions();

    // Step 6: Demonstrate relay call
    await demo.demonstrateRelayCall();

    // Step 7: Controller management
    await demo.demonstrateControllerManagement();

    // Final summary
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    DEMO COMPLETE                           ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("\n📊 Final Contract Info:");
    const info = demo.getContractInfo();
    console.log(`   Universal Profile: ${info.universalProfile}`);
    console.log(`   KeyManager:        ${info.keyManager}`);
    console.log("\n✅ All features demonstrated successfully!");
    console.log("   - Shared UP deployment");
    console.log("   - Multi-controller setup with granular permissions");
    console.log("   - Batch transaction execution");
    console.log("   - Relay call pattern");
    console.log("   - Controller management\n");

  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
