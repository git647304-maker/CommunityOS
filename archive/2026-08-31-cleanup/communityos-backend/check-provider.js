import 'dotenv/config';
import { prisma } from './src/db/connection.js';

try {
  const providers = await prisma.provider.findMany({
    where: {
      companyName: 'AquaFlow Kenya',
    },
  });

  console.dir(providers, { depth: 10 });
} catch (error) {
  console.error('ERROR:', error);
} finally {
  await prisma.$disconnect();
}
