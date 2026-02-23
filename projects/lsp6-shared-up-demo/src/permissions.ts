/**
 * LSP6 Permission Constants
 * 
 * These are the actual permission bitmasks used by LSP6 KeyManager.
 * Each permission is a 32-byte value with specific bits set.
 */

// LSP6 Permission Bitmasks (from LUKSO standard)
export const LSP6_PERMISSIONS = {
  // Administrative permissions
  CHANGE_OWNER: "0x0000000000000000000000000000000000000000000000000000000000000001",
  ADD_CONTROLLER: "0x0000000000000000000000000000000000000000000000000000000000000002",
  EDIT_PERMISSIONS: "0x0000000000000000000000000000000000000000000000000000000000000004",
  ADD_EXTENSION: "0x0000000000000000000000000000000000000000000000000000000000000008",
  CHANGE_EXTENSION: "0x0000000000000000000000000000000000000000000000000000000000000010",
  
  // Execution permissions
  EXECUTE: "0x0000000000000000000000000000000000000000000000000000000000000100",
  EXECUTE_CALL: "0x0000000000000000000000000000000000000000000000000000000000000200",
  EXECUTE_DELEGATECALL: "0x0000000000000000000000000000000000000000000000000000000000000400",
  EXECUTE_STATICCALL: "0x0000000000000000000000000000000000000000000000000000000000000800",
  
  // Data permissions
  SETDATA: "0x0000000000000000000000000000000000000000000000000000000000010000",
  SUPER_SETDATA: "0x0000000000000000000000000000000000000000000000000000000000020000",
  
  // Signature permissions
  SIGN: "0x0000000000000000000000000000000000000000000000000000000000040000",
  
  // Batch permissions
  BATCH_CALLS: "0x0000000000000000000000000000000000000000000000000000000000080000",
  
  // Combined role permissions
  ADMIN: "0x00000000000000000000000000000000000000000000000000000000000fffff", // All permissions
  EXECUTOR: "0x0000000000000000000000000000000000000000000000000000000000000300", // EXECUTE + EXECUTE_CALL
  DATA_MANAGER: "0x0000000000000000000000000000000000000000000000000000000000030000", // SETDATA + SUPER_SETDATA
  SIGNER: "0x0000000000000000000000000000000000000000000000000000000000040000", // SIGN only
  LIMITED_EXECUTOR: "0x0000000000000000000000000000000000000000000000000000000000000100", // EXECUTE only
};

// LSP6 KeyManager permission key prefix
// Format: 0x4b80742d00000000c6dd0000<address>
export const LSP6_PERMISSION_KEY_PREFIX = "0x4b80742d00000000c6dd0000";

/**
 * Generate the permission key for a given address
 * @param address - The controller address
 * @returns The full permission key
 */
export function getPermissionKey(address: string): string {
  const cleanAddress = address.toLowerCase().replace("0x", "");
  return `${LSP6_PERMISSION_KEY_PREFIX}${cleanAddress}`;
}

/**
 * Check if a permission bitmask includes a specific permission
 * @param permissions - The full permissions value
 * @param permission - The permission to check for
 * @returns boolean
 */
export function hasPermission(permissions: string, permission: string): boolean {
  const perms = BigInt(permissions);
  const check = BigInt(permission);
  return (perms & check) === check;
}

/**
 * Combine multiple permissions into a single bitmask
 * @param permissions - Array of permission strings
 * @returns Combined permission bitmask
 */
export function combinePermissions(permissions: string[]): string {
  let combined = BigInt(0);
  for (const perm of permissions) {
    combined |= BigInt(perm);
  }
  return "0x" + combined.toString(16).padStart(64, "0");
}

/**
 * Controller role definitions with descriptions
 */
export const CONTROLLER_ROLES = {
  ADMIN: {
    name: "Admin",
    permissions: LSP6_PERMISSIONS.ADMIN,
    description: "Full control - can manage all aspects of the UP",
    capabilities: [
      "Change UP owner",
      "Add/remove controllers",
      "Edit permissions",
      "Execute all transaction types",
      "Set any data",
      "Sign messages"
    ]
  },
  EXECUTOR: {
    name: "Executor",
    permissions: LSP6_PERMISSIONS.EXECUTOR,
    description: "Can execute transactions through the UP",
    capabilities: [
      "Execute transfers",
      "Call contracts",
      "Cannot modify permissions or data"
    ]
  },
  DATA_MANAGER: {
    name: "Data Manager",
    permissions: LSP6_PERMISSIONS.DATA_MANAGER,
    description: "Can set data on the UP",
    capabilities: [
      "Set data keys",
      "Manage profile metadata",
      "Update profile information"
    ]
  },
  SIGNER: {
    name: "Signer",
    permissions: LSP6_PERMISSIONS.SIGNER,
    description: "Can sign messages on behalf of the UP",
    capabilities: [
      "Sign messages",
      "Create signatures for off-chain validation",
      "Cannot execute transactions"
    ]
  },
  LIMITED_EXECUTOR: {
    name: "Limited Executor",
    permissions: LSP6_PERMISSIONS.LIMITED_EXECUTOR,
    description: "Can execute basic transfers only",
    capabilities: [
      "Execute simple transfers",
      "Cannot call contracts",
      "Cannot set data"
    ]
  }
};
