import { prisma } from '../db/connection.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

export async function getCommunities(tenantId) {
  const communities = await prisma.community.findMany({
    where: { tenantId },
  });

  return communities;
}

export async function getCommunityById(communityId, tenantId) {
  const community = await prisma.community.findFirst({
    where: {
      AND: [{ id: communityId }, { tenantId }],
    },
  });

  if (!community) {
    throw new NotFoundError('Community');
  }

  return community;
}

export async function getCommunityOverview(communityId, tenantId) {
  const community = await getCommunityById(communityId, tenantId);

  const [orders, incidents] = await Promise.all([
    prisma.order.findMany({
      where: {
        AND: [{ communityId }, { tenantId }],
      },
    }),
    prisma.event.findMany({
      where: {
        AND: [{ tenantId }],
      },
      distinct: ['orderId'],
    }),
  ]);

  return {
    community,
    ordersCount: orders.length,
    recentOrders: orders.slice(-5),
    incidentsCount: incidents.length,
  };
}
