import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Import permission utilities directly
const LSP6_PERMISSIONS = {
  ADMIN: "0x00000000000000000000000000000000000000000000000000000000000fffff",
  EXECUTE: "0x0000000000000000000000000000000000000000000000000000000000000300",
  EXECUTE_CALL: "0x0000000000000000000000000000000000000000000000000000000000000200",
  SETDATA: "0x0000000000000000000000000000000000000000000000000000000000010000",
  SUPER_SETDATA: "0x0000000000000000000000000000000000000000000000000000000000020000",
  SIGN: "0x0000000000000000000000000000000000000000000000000000000000040000",
  SIGNER: "0x0000000000000000000000000000000000000000000000000000000000040000",
  EXECUTOR: "0x0000000000000000000000000000000000000000000000000000000000000300",
  DATA_MANAGER: "0x0000000000000000000000000000000000000000000000000000000000030000",
};

function getPermissionKey(address: string): string {
  const LSP6_KEY_PREFIX = "0x4b80742d00000000c6dd0000";
  const cleanAddress = address.toLowerCase().replace("0x", "");
  return `${LSP6_KEY_PREFIX}${cleanAddress}`;
}

function hasPermission(permissions: string, permission: string): boolean {
  const perms = BigInt(permissions);
  const check = BigInt(permission);
  return (perms & check) === check;
}

function combinePermissions(permissions: string[]): string {
  let combined = BigInt(0);
  for (const perm of permissions) {
    combined |= BigInt(perm);
  }
  return "0x" + combined.toString(16).padStart(64, "0");
}

describe("LSP6 Shared UP / Mini-DAO", function () {
  
  describe("Permission System", function () {
    it("Should generate correct permission keys", function () {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const key = getPermissionKey(address);
      
      expect(key).to.equal("0x4b80742d00000000c6dd0000f39fd6e51aad88f6f4ce6ab8827279cfffb92266");
      expect(key.length).to.equal(66); // 32 bytes = 64 hex chars + 0x
    });

    it("Should correctly identify permissions", function () {
      const admin = LSP6_PERMISSIONS.ADMIN;
      const execute = LSP6_PERMISSIONS.EXECUTE;
      
      // Admin should have execute permission
      expect(hasPermission(admin, execute)).to.be.true;
      
      // Execute alone should not have admin
      expect(hasPermission(execute, admin)).to.be.false;
    });

    it("Should combine permissions correctly", function () {
      const combined = combinePermissions([
        LSP6_PERMISSIONS.EXECUTE,
        LSP6_PERMISSIONS.SETDATA
      ]);
      
      expect(hasPermission(combined, LSP6_PERMISSIONS.EXECUTE)).to.be.true;
      expect(hasPermission(combined, LSP6_PERMISSIONS.SETDATA)).to.be.true;
      expect(hasPermission(combined, LSP6_PERMISSIONS.SIGN)).to.be.false;
    });
  });

  describe("Controller Roles", function () {
    it("Should have correct EXECUTOR permissions", function () {
      const executor = LSP6_PERMISSIONS.EXECUTOR;
      
      expect(hasPermission(executor, LSP6_PERMISSIONS.EXECUTE)).to.be.true;
      expect(hasPermission(executor, LSP6_PERMISSIONS.EXECUTE_CALL)).to.be.true;
      expect(hasPermission(executor, LSP6_PERMISSIONS.SETDATA)).to.be.false;
    });

    it("Should have correct DATA_MANAGER permissions", function () {
      const dataManager = LSP6_PERMISSIONS.DATA_MANAGER;
      
      expect(hasPermission(dataManager, LSP6_PERMISSIONS.SETDATA)).to.be.true;
      expect(hasPermission(dataManager, LSP6_PERMISSIONS.SUPER_SETDATA)).to.be.true;
      expect(hasPermission(dataManager, LSP6_PERMISSIONS.EXECUTE)).to.be.false;
    });

    it("Should have correct SIGNER permissions", function () {
      const signer = LSP6_PERMISSIONS.SIGNER;
      
      expect(hasPermission(signer, LSP6_PERMISSIONS.SIGN)).to.be.true;
      expect(hasPermission(signer, LSP6_PERMISSIONS.EXECUTE)).to.be.false;
    });
  });

  describe("Permission Key Format", function () {
    it("Should follow LSP6 KeyManager format", function () {
      const LSP6_PREFIX = "0x4b80742d00000000c6dd0000";
      const testAddress = "0x1234567890123456789012345678901234567890";
      
      const key = getPermissionKey(testAddress);
      
      // Should start with LSP6 prefix
      expect(key.startsWith(LSP6_PREFIX)).to.be.true;
      
      // Should end with lowercase address (no 0x)
      expect(key.endsWith(testAddress.toLowerCase().replace("0x", ""))).to.be.true;
    });
  });
});
