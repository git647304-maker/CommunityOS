import { prisma } from '../db/connection.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';
import { emit, EVENTS } from '../utils/events.js';

/**
 * Get all providers belonging to a tenant.
 */
export async function getProviders(tenantId) {
  const providers = await prisma.provider.findMany({
    where: {
      tenantId,
    },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
        },
      },
      services: true,
      employees: true,
    },
    orderBy: {
      companyName: 'asc',
    },
  });

  return providers;
}

/**
 * Get one provider.
 */
export async function getProviderById(providerId, tenantId) {
  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      tenantId,
    },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
        },
      },
      services: true,
      employees: true,
    },
  });

  if (!provider) {
    throw new NotFoundError('Provider');
  }

  return provider;
}

/**
 * Get orders belonging to a specific provider.
 */
export async function getProviderOrders(
  providerId,
  tenantId,
  status = null
) {
  // First make sure the provider belongs to this tenant.
  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      tenantId,
    },
  });

  if (!provider) {
    throw new NotFoundError('Provider');
  }

  const where = {
    providerId,
    tenantId,
  };

  if (status) {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          service: true,
        },
      },
      resident: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      community: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders;
}

/**
 * Accept an order on behalf of a provider.
 *
 * Security rules:
 * 1. Provider must belong to the current tenant.
 * 2. Order must belong to the same tenant.
 * 3. Order must belong to the selected provider.
 * 4. Only CREATED orders can be accepted.
 */
export async function acceptProviderOrder(
  providerId,
  orderId,
  tenantId,
  userId
) {
  // Check provider
  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      tenantId,
    },
  });

  if (!provider) {
    throw new NotFoundError('Provider');
  }

  // Check order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId,
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      resident: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      provider: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  // Make sure this order belongs to this provider.
  if (order.providerId !== providerId) {
    const error = new Error(
      'This order does not belong to the selected provider.'
    );

    error.statusCode = 403;
    throw error;
  }

  // Prevent accepting an order twice.
  if (order.status !== 'CREATED') {
    const error = new Error(
      `Order cannot be accepted because its current status is ${order.status}.`
    );

    error.statusCode = 409;
    throw error;
  }

  // Update the order.
  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: 'PROVIDER_ACCEPTED',
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      resident: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      provider: true,
      community: true,
    },
  });

  // Record the domain event.
  await emit(EVENTS.ORDER_ACCEPTED, {
    order: updatedOrder,
    actorId: userId,
    providerId,
    tenantId,
  });

  logger.info(
    {
      orderId,
      providerId,
      tenantId,
      userId,
    },
    'Order accepted by provider'
  );

  return updatedOrder;
}