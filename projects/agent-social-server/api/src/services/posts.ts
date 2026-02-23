import { prisma } from '../db/client';
import { logger } from '../logger';

export interface CreatePostInput {
  authorAddress: string;
  contentHash: string;
  contentPreview: string;
  signature: string;
  ipfsCid?: string;
}

export interface FeedOptions {
  cursor?: string;
  limit?: number;
  agentAddress?: string;
}

export class PostService {
  /**
   * Create a new post
   */
  async createPost(input: CreatePostInput) {
    try {
      // Ensure agent exists
      await prisma.agent.upsert({
        where: { address: input.authorAddress },
        update: { 
          lastActiveAt: new Date(),
          totalPosts: { increment: 1 },
        },
        create: {
          address: input.authorAddress,
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
          totalPosts: 1,
        },
      });

      // Get current karma for the post
      const agent = await prisma.agent.findUnique({
        where: { address: input.authorAddress },
        select: { reputationScore: true },
      });

      // Create post
      const post = await prisma.post.create({
        data: {
          authorAddress: input.authorAddress,
          contentHash: input.contentHash,
          contentPreview: input.contentPreview.slice(0, 280), // Limit preview
          ipfsCid: input.ipfsCid,
          signature: input.signature,
          karmaAtPost: agent?.reputationScore || 0,
        },
        include: {
          author: {
            select: {
              address: true,
              username: true,
              reputationScore: true,
            },
          },
        },
      });

      logger.info(`Post created: ${post.id} by ${input.authorAddress}`);
      return post;
    } catch (error) {
      logger.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get feed in chronological order
   */
  async getChronologicalFeed(options: FeedOptions = {}) {
    const { cursor, limit = 20, agentAddress } = options;

    const posts = await prisma.post.findMany({
      where: {
        ...(agentAddress && { authorAddress: agentAddress }),
        ...(cursor && {
          timestamp: {
            lt: new Date(cursor),
          },
        }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      include: {
        author: {
          select: {
            address: true,
            username: true,
            reputationScore: true,
          },
        },
      },
    });

    const nextCursor = posts.length === limit 
      ? posts[posts.length - 1].timestamp.toISOString() 
      : null;

    return { posts, nextCursor };
  }

  /**
   * Get feed ranked by karma (reputation)
   */
  async getKarmaFeed(options: FeedOptions = {}) {
    const { cursor, limit = 20 } = options;

    const posts = await prisma.post.findMany({
      where: {
        ...(cursor && {
          AND: [
            { karmaAtPost: { lte: parseInt(cursor.split('_')[0] || '0') } },
            { timestamp: { lt: new Date(cursor.split('_')[1] || Date.now()) } },
          ],
        }),
      },
      orderBy: [
        { karmaAtPost: 'desc' },
        { timestamp: 'desc' },
      ],
      take: limit,
      include: {
        author: {
          select: {
            address: true,
            username: true,
            reputationScore: true,
          },
        },
      },
    });

    const nextCursor = posts.length === limit 
      ? `${posts[posts.length - 1].karmaAtPost}_${posts[posts.length - 1].timestamp.toISOString()}` 
      : null;

    return { posts, nextCursor };
  }

  /**
   * Get posts by a specific agent
   */
  async getPostsByAgent(agentAddress: string, options: Omit<FeedOptions, 'agentAddress'> = {}) {
    return this.getChronologicalFeed({ ...options, agentAddress });
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            address: true,
            username: true,
            reputationScore: true,
          },
        },
      },
    });
  }
}
