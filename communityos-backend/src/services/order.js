import { prisma } from '../db/connection.js';
import { NotFoundError } from '../utils/errors.js';
import { emit, EVENTS } from '../utils/events.js';
import { storeIdempotencyResult, checkIdempotency } from '../utils/idempotency.js';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

export async function createOrder(data, userId, tenantId) {
  const { communityId, providerId, items, notes, idempotencyKey } = data;

  // Check idempotency
  if (idempotencyKey) {
    const existing = await checkIdempotency(idempotencyKey);
    if (existing) {
      logger.info({ idempotencyKey }, 'Idempotent request detected');
      return existing;
    }
  }

  // Calculate total
  let total = 0;
  for (const item of items) {
    const service = await prisma.service.findUnique({
      where: { id: item.serviceId },
    });

    if (!service) {
      throw new NotFoundError('Service');
    }

    total += service.unitPrice * item.quantity;
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      id: uuidv4(),
      tenantId,
      residentId: userId,
      communityId,
      providerId,
      status: 'CREATED',
      total,
      notes,
      idempotencyKey,
      items: {
        create: items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: 0, // Will be fetched from service
        })),
      },
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      provider: true,
    },
  });

  // Fetch prices for items
  const itemsWithPrices = await Promise.all(
    order.items.map(async (item) => {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
      });
      return { ...item, unitPrice: service.unitPrice };
    })
  );

  const response = {
    id: order.id,
    tenantId: order.tenantId,
    residentId: order.residentId,
    communityId: order.communityId,
    providerId: order.providerId,
    status: order.status,
    total: order.total,
    items: itemsWithPrices,
    createdAt: order.createdAt,
  };

  // Emit event
  await emit(EVENTS.ORDER_CREATED, { order: response });

  // Store idempotency result
  if (idempotencyKey) {
    await storeIdempotencyResult(idempotencyKey, response);
  }

  logger.info({ orderId: order.id, userId }, 'Order created');

  return response;
}

export async function getOrdersByUser(userId, tenantId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        AND: [{ residentId: userId }, { tenantId }],
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        provider: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.order.count({
      where: {
        AND: [{ residentId: userId }, { tenantId }],
      },
    }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getOrderById(orderId, tenantId) {
  const order = await prisma.order.findFirst({
    where: {
      AND: [{ id: orderId }, { tenantId }],
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      provider: true,
      events: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  return order;
}

export async function acceptOrder(orderId, providerId, tenantId) {
  const order = await getOrderById(orderId, tenantId);

  if (order.providerId !== providerId) {
    throw new Error('Provider mismatch');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PROVIDER_ACCEPTED',
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      provider: true,
    },
  });

  // Emit event
  await emit(EVENTS.ORDER_ACCEPTED, { order: updatedOrder });

  logger.info({ orderId, providerId }, 'Order accepted by provider');

  return updatedOrder;
}

export async function updateOrderStatus(orderId, status, tenantId) {
  const order = await getOrderById(orderId, tenantId);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
    },
    include: {
      items: {
        include: {
          service: true,
        },
      },
      provider: true,
    },
  });

  // Emit appropriate event
  const eventMap = {
    PROVIDER_ACCEPTED: EVENTS.ORDER_ACCEPTED,
    WORKER_ASSIGNED: EVENTS.ORDER_ASSIGNED,
    IN_PROGRESS: EVENTS.ORDER_IN_PROGRESS,
    COMPLETED: EVENTS.ORDER_COMPLETED,
    CANCELLED: EVENTS.ORDER_CANCELLED,
  };

  const event = eventMap[status];
  if (event) {
    await emit(event, { order: updatedOrder });
  }

  logger.info({ orderId, status }, 'Order status updated');

  return updatedOrder;
}
