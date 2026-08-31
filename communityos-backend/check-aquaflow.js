import 'dotenv/config';
import { prisma } from './src/db/connection.js';

try {
  const users = await prisma.user.findMany({
    where: {
      email: 'aquaflow@provider.com',
    },
    include: {
      roles: true,
      providers: true,
      providerEmployees: true,
    },
  });

  console.dir(users, { depth: 10 });
} catch (error) {
  console.error('ERROR:', error);
} finally {
  await prisma.$disconnect();
}
