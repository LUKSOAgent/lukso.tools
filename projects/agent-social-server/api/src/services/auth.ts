import { ethers } from 'ethers';
import { logger } from '../logger';

const DOMAIN_NAME = 'AgentSocialNetwork';
const DOMAIN_VERSION = '1';

// EIP-712 types for post authentication
const POST_TYPES = {
  Post: [
    { name: 'contentHash', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

export interface PostSignatureData {
  contentHash: string;
  timestamp: number;
}

export class AuthService {
  private domain: ethers.TypedDataDomain;

  constructor(chainId: number = 42) {
    this.domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId,
    };
  }

  /**
   * Verify an EIP-712 signature for a post
   */
  async verifyPostSignature(
    address: string,
    data: PostSignatureData,
    signature: string
  ): Promise<boolean> {
    try {
      const normalizedAddress = address.toLowerCase();
      
      const recoveredAddress = ethers.verifyTypedData(
        this.domain,
        POST_TYPES,
        data,
        signature
      );

      return recoveredAddress.toLowerCase() === normalizedAddress;
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Recover address from signature
   */
  recoverAddress(data: PostSignatureData, signature: string): string | null {
    try {
      return ethers.verifyTypedData(
        this.domain,
        POST_TYPES,
        data,
        signature
      );
    } catch (error) {
      logger.error('Address recovery failed:', error);
      return null;
    }
  }

  /**
   * Hash content using keccak256
   */
  static hashContent(content: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(content));
  }

  /**
   * Validate Universal Profile address format
   */
  static isValidUPAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}
