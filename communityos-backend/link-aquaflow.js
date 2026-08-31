import 'dotenv/config';
import { prisma } from './src/db/connection.js';


const supabaseUserId = 'b0a829bb-af90-4bb2-9a95-eac05a284754';
const email = 'aquaflow@provider.com';
const tenantId = 'green-valley';
const providerId = 'aquaflow-ksh';

try {
  console.log('Checking tenant...');

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant "${tenantId}" was not found.`);
  }

  console.log('Tenant found:', tenant.name);

  console.log('Checking AquaFlow provider...');

  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      tenantId,
    },
  });

  if (!provider) {
    throw new Error(
      `Provider "${providerId}" was not found in tenant "${tenantId}".`
    );
  }

  console.log('Provider found:', provider.companyName);

  console.log('Creating/updating CommunityOS user...');

  const user = await prisma.user.upsert({
    where: {
      id: supabaseUserId,
    },
    update: {
      email,
      tenantId,
      fullName: 'AquaFlow Manager',
      phone: '+254700000004',
      isActive: true,
    },
    create: {
      id: supabaseUserId,
      tenantId,
      email,
      passwordHash: '',
      fullName: 'AquaFlow Manager',
      phone: '+254700000004',
      isActive: true,
    },
  });

  console.log('CommunityOS user ready:', user.id);

  console.log('Creating PROVIDER_REP role...');

  const existingRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      role: 'PROVIDER_REP',
    },
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        tenantId,
        role: 'PROVIDER_REP',
        resourceId: providerId,
      },
    });

    console.log('PROVIDER_REP role created.');
  } else {
    console.log('PROVIDER_REP role already exists.');
  }

  console.log('Connecting user to AquaFlow provider...');

  await prisma.provider.update({
    where: {
      id: providerId,
    },
    data: {
      userId: user.id,
    },
  });

  console.log('AquaFlow provider connected successfully.');

  console.log('');
  console.log('========================================');
  console.log('AQUAFLOW SETUP COMPLETE');
  console.log('========================================');
  console.log('Email:', email);
  console.log('Supabase ID:', supabaseUserId);
  console.log('Tenant:', tenantId);
  console.log('Provider:', provider.companyName);
  console.log('Provider ID:', providerId);
  console.log('Role: PROVIDER_REP');
  console.log('========================================');

} catch (error) {
  console.error('');
  console.error('AQUAFLOW SETUP FAILED');
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
