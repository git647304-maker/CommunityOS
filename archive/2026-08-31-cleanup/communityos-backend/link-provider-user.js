import 'dotenv/config';
import { prisma } from './src/db/connection.js';

const USER_ID = 'user-provider-1';
const PROVIDER_ID = 'aquaflow-ksh';

try {
  console.log('Finding AquaFlow user...');

  const user = await prisma.user.findUnique({
    where: {
      id: USER_ID,
    },
    include: {
      roles: true,
    },
  });

  if (!user) {
    throw new Error('AquaFlow user not found');
  }

  console.log(`User found: ${user.email}`);

  console.log('Finding AquaFlow provider...');

  const provider = await prisma.provider.findUnique({
    where: {
      id: PROVIDER_ID,
    },
  });

  if (!provider) {
    throw new Error('AquaFlow provider not found');
  }

  console.log(`Provider found: ${provider.companyName}`);

  console.log('Linking user to provider...');

  const updatedProvider = await prisma.provider.update({
    where: {
      id: PROVIDER_ID,
    },
    data: {
      userId: USER_ID,
    },
  });

  console.log('');
  console.log('=================================');
  console.log('AQUAFLOW LINKED SUCCESSFULLY');
  console.log('=================================');
  console.log(`User:     ${user.email}`);
  console.log(`User ID:  ${USER_ID}`);
  console.log(`Provider: ${provider.companyName}`);
  console.log(`Provider ID: ${PROVIDER_ID}`);
  console.log(`Provider userId: ${updatedProvider.userId}`);
  console.log('=================================');

} catch (error) {
  console.error('');
  console.error('LINK FAILED');
  console.error(error);
} finally {
  await prisma.$disconnect();
}
