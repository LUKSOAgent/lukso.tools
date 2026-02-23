import { prisma } from '../db/client';
import { logger } from '../logger';

export class AgentService {
  /**
   * Get agent profile with stats
   */
  async getProfile(address: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { address: address.toLowerCase() },
        include: {
          _count: {
            select: {
              following: true,
              followers: true,
              posts: true,
            },
          },
        },
      });

      if (!agent) {
        return null;
      }

      return {
        address: agent.address,
        username: agent.username,
        metadata: agent.metadata,
        reputationScore: agent.reputationScore,
        totalPosts: agent.totalPosts,
        firstSeenAt: agent.firstSeenAt,
        lastActiveAt: agent.lastActiveAt,
        stats: {
          following: agent._count.following,
          followers: agent._count.followers,
          posts: agent._count.posts,
        },
      };
    } catch (error) {
      logger.error('Error fetching agent profile:', error);
      throw error;
    }
  }

  /**
   * Get agent's social graph
   */
  async getGraph(address: string) {
    try {
      const [following, followers] = await Promise.all([
        prisma.follow.findMany({
          where: { followerAddress: address.toLowerCase() },
          include: {
            following: {
              select: {
                address: true,
                username: true,
                reputationScore: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
        prisma.follow.findMany({
          where: { followingAddress: address.toLowerCase() },
          include: {
            follower: {
              select: {
                address: true,
                username: true,
                reputationScore: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
      ]);

      return {
        address: address.toLowerCase(),
        following: following.map(f => ({
          address: f.following.address,
          username: f.following.username,
          reputationScore: f.following.reputationScore,
          followedAt: f.timestamp,
        })),
        followers: followers.map(f => ({
          address: f.follower.address,
          username: f.follower.username,
          reputationScore: f.follower.reputationScore,
          followedAt: f.timestamp,
        })),
        counts: {
          following: following.length,
          followers: followers.length,
        },
      };
    } catch (error) {
      logger.error('Error fetching agent graph:', error);
      throw error;
    }
  }

  /**
   * Get agent's reputation history
   */
  async getReputation(address: string) {
    try {
      const [agent, events] = await Promise.all([
        prisma.agent.findUnique({
          where: { address: address.toLowerCase() },
          select: { reputationScore: true },
        }),
        prisma.reputationEvent.findMany({
          where: { agentAddress: address.toLowerCase() },
          orderBy: { timestamp: 'desc' },
          take: 50,
        }),
      ]);

      if (!agent) {
        return null;
      }

      return {
        address: address.toLowerCase(),
        currentScore: agent.reputationScore,
        history: events.map(e => ({
          type: e.type,
          amount: e.amount,
          reason: e.reason,
          timestamp: e.timestamp,
          transactionHash: e.transactionHash,
        })),
      };
    } catch (error) {
      logger.error('Error fetching agent reputation:', error);
      throw error;
    }
  }

  /**
   * Update agent metadata
   */
  async updateMetadata(address: string, metadata: Record<string, any>) {
    try {
      const agent = await prisma.agent.update({
        where: { address: address.toLowerCase() },
        data: {
          metadata: metadata as any,
          lastActiveAt: new Date(),
        },
      });

      return agent;
    } catch (error) {
      logger.error('Error updating agent metadata:', error);
      throw error;
    }
  }
}
