import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { LSP26_ABI, LSP7_ABI, LSP26_CONTRACT_ADDRESS, REPUTATION_TOKEN_ADDRESS } from './contracts';
import { logger } from './logger';

export class Indexer {
  private prisma: PrismaClient;
  private provider: ethers.JsonRpcProvider;
  private lsp26: ethers.Contract;
  private reputationToken: ethers.Contract;
  private isRunning: boolean = false;
  private pollInterval: number = 15000; // 15 seconds

  constructor() {
    this.prisma = new PrismaClient();
    
    const rpcUrl = process.env.LUKSO_RPC_URL || 'https://rpc.mainnet.lukso.network';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    this.lsp26 = new ethers.Contract(LSP26_CONTRACT_ADDRESS, LSP26_ABI, this.provider);
    this.reputationToken = new ethers.Contract(REPUTATION_TOKEN_ADDRESS, LSP7_ABI, this.provider);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting LUKSO blockchain indexer...');

    try {
      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      logger.info(`Connected to LUKSO mainnet at block ${currentBlock}`);

      // Get last indexed state
      const state = await this.prisma.indexerState.findUnique({
        where: { id: 1 },
      });

      // Start polling loops
      this.pollLSP26Events(state?.lastBlockLsp26 || 0);
      this.pollReputationEvents(state?.lastBlockReputation || 0);
      
      logger.info('✅ Indexer started successfully');
    } catch (error) {
      logger.error('Failed to start indexer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.prisma.$disconnect();
    logger.info('👋 Indexer stopped');
  }

  private async pollLSP26Events(lastBlock: number): Promise<void> {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlock) {
          const fromBlock = lastBlock + 1;
          logger.debug(`Scanning LSP26 events from block ${fromBlock} to ${currentBlock}`);

          // Query Follow events
          const followFilter = this.lsp26.filters.Follow();
          const followEvents = await this.lsp26.queryFilter(followFilter, fromBlock, currentBlock);
          
          // Query Unfollow events
          const unfollowFilter = this.lsp26.filters.Unfollow();
          const unfollowEvents = await this.lsp26.queryFilter(unfollowFilter, fromBlock, currentBlock);

          // Process Follow events
          for (const event of followEvents) {
            await this.processFollowEvent(event as ethers.EventLog);
          }

          // Process Unfollow events
          for (const event of unfollowEvents) {
            await this.processUnfollowEvent(event as ethers.EventLog);
          }

          // Update state
          await this.prisma.indexerState.update({
            where: { id: 1 },
            data: { 
              lastBlockLsp26: currentBlock,
              lastUpdated: new Date(),
            },
          });

          lastBlock = currentBlock;
          
          if (followEvents.length > 0 || unfollowEvents.length > 0) {
            logger.info(`Indexed ${followEvents.length} follows, ${unfollowEvents.length} unfollows at block ${currentBlock}`);
          }
        }
      } catch (error) {
        logger.error('Error polling LSP26 events:', error);
      }

      await this.sleep(this.pollInterval);
    }
  }

  private async pollReputationEvents(lastBlock: number): Promise<void> {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlock) {
          const fromBlock = lastBlock + 1;
          logger.debug(`Scanning reputation events from block ${fromBlock} to ${currentBlock}`);

          const transferFilter = this.reputationToken.filters.Transfer();
          const events = await this.reputationToken.queryFilter(transferFilter, fromBlock, currentBlock);

          for (const event of events) {
            await this.processReputationTransfer(event as ethers.EventLog);
          }

          // Update state
          await this.prisma.indexerState.update({
            where: { id: 1 },
            data: { 
              lastBlockReputation: currentBlock,
              lastUpdated: new Date(),
            },
          });

          lastBlock = currentBlock;
          
          if (events.length > 0) {
            logger.info(`Indexed ${events.length} reputation transfers at block ${currentBlock}`);
          }
        }
      } catch (error) {
        logger.error('Error polling reputation events:', error);
      }

      await this.sleep(this.pollInterval);
    }
  }

  private async processFollowEvent(event: ethers.EventLog): Promise<void> {
    try {
      const follower = (event.args?.[0] as string).toLowerCase();
      const followee = (event.args?.[1] as string).toLowerCase();
      const blockNumber = event.blockNumber;
      const txHash = event.transactionHash;

      // Ensure both agents exist
      await this.ensureAgentExists(follower);
      await this.ensureAgentExists(followee);

      // Create follow relationship
      await this.prisma.follow.upsert({
        where: {
          followerAddress_followingAddress: {
            followerAddress: follower,
            followingAddress: followee,
          },
        },
        update: {
          timestamp: new Date(),
          blockNumber,
          transactionHash: txHash,
        },
        create: {
          followerAddress: follower,
          followingAddress: followee,
          blockNumber,
          transactionHash: txHash,
        },
      });

      logger.debug(`Follow indexed: ${follower} -> ${followee}`);
    } catch (error) {
      logger.error('Error processing follow event:', error);
    }
  }

  private async processUnfollowEvent(event: ethers.EventLog): Promise<void> {
    try {
      const follower = (event.args?.[0] as string).toLowerCase();
      const followee = (event.args?.[1] as string).toLowerCase();

      // Delete follow relationship
      await this.prisma.follow.deleteMany({
        where: {
          followerAddress: follower,
          followingAddress: followee,
        },
      });

      logger.debug(`Unfollow indexed: ${follower} -> ${followee}`);
    } catch (error) {
      logger.error('Error processing unfollow event:', error);
    }
  }

  private async processReputationTransfer(event: ethers.EventLog): Promise<void> {
    try {
      const from = (event.args?.[1] as string).toLowerCase();
      const to = (event.args?.[2] as string).toLowerCase();
      const amount = Number(event.args?.[3]);
      const blockNumber = event.blockNumber;
      const txHash = event.transactionHash;

      // Skip mint/burn from zero address if needed
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

      if (from !== ZERO_ADDRESS) {
        // Burn/Slash event
        await this.ensureAgentExists(from);
        await this.prisma.reputationEvent.create({
          data: {
            agentAddress: from,
            amount: -amount,
            type: 'BURN',
            timestamp: new Date(),
            blockNumber,
            transactionHash: txHash,
            tokenAddress: REPUTATION_TOKEN_ADDRESS,
          },
        });

        await this.updateAgentReputation(from);
      }

      if (to !== ZERO_ADDRESS) {
        // Earn event
        await this.ensureAgentExists(to);
        await this.prisma.reputationEvent.create({
          data: {
            agentAddress: to,
            amount: amount,
            type: 'EARN',
            timestamp: new Date(),
            blockNumber,
            transactionHash: txHash,
            tokenAddress: REPUTATION_TOKEN_ADDRESS,
          },
        });

        await this.updateAgentReputation(to);
      }

      logger.debug(`Reputation transfer indexed: ${from} -> ${to} (${amount})`);
    } catch (error) {
      logger.error('Error processing reputation transfer:', error);
    }
  }

  private async ensureAgentExists(address: string): Promise<void> {
    await this.prisma.agent.upsert({
      where: { address },
      update: { lastActiveAt: new Date() },
      create: { 
        address,
        firstSeenAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
  }

  private async updateAgentReputation(address: string): Promise<void> {
    const result = await this.prisma.reputationEvent.aggregate({
      where: { agentAddress: address },
      _sum: { amount: true },
    });

    const score = result._sum.amount || 0;

    await this.prisma.agent.update({
      where: { address },
      data: { reputationScore: score },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
