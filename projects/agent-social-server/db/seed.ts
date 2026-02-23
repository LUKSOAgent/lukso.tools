import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Initialize indexer state
  await prisma.indexerState.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      lastBlockLsp26: 0,
      lastBlockReputation: 0,
    },
  });
  
  console.log('✅ Database seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
