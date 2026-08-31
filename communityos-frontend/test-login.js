import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './src/db/connection.js';

const email = 'aquaflow@provider.com';
const password = 'provider123';
const tenantId = 'green-valley';

try {
  console.log('Finding AquaFlow user...');

  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email,
      },
    },
    include: {
      roles: true,
      providers: true,
      providerEmployees: true,
    },
  });

  console.log('USER FOUND:', !!user);

  if (!user) {
    console.log('No user found');
    process.exit(1);
  }

  console.log('Email:', user.email);
  console.log('Tenant:', user.tenantId);
  console.log('Roles:', user.roles);
  console.log('Providers:', user.providers);
  console.log('Provider employees:', user.providerEmployees);

  console.log(
    'Password hash exists:',
    !!user.passwordHash
  );

  console.log(
    'Password hash length:',
    user.passwordHash?.length
  );

  const matches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  console.log('PASSWORD MATCHES:', matches);

  await prisma.$disconnect();
} catch (error) {
  console.error('TEST FAILED:');
  console.error(error);

  await prisma.$disconnect();
  process.exit(1);
}