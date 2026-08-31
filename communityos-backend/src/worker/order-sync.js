import { broadcastToOrder, broadcastToProvider, broadcastToCommunity } from '../server.js';
import { prisma } from '../db/connection.js';
import { on, EVENTS } from '../utils/events.js';
import logger from '../config/logger.js';

// Listen to order events and create timeline entries
on(EVENTS.ORDER_CREATED, async ({ order }) => {
  try {
    await prisma.event.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        type: 'ORDER_CREATED',
        metadata: { total: order.total },
      },
    });
  } catch (error) {
    logger.error({ error, orderId: order.id }, 'Failed to create order event');
  }
});

on(EVENTS.ORDER_ACCEPTED, async ({ order }) => {
  try {
    await prisma.event.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        type: 'ORDER_ACCEPTED',
        metadata: { providerId: order.providerId },
      },
    });

    broadcastToOrder(order.id, 'timeline:updated', {
      type: 'ORDER_ACCEPTED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, orderId: order.id }, 'Failed to create accepted event');
  }
});

on(EVENTS.ORDER_IN_PROGRESS, async ({ order }) => {
  try {
    await prisma.event.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        type: 'ORDER_IN_PROGRESS',
      },
    });

    broadcastToOrder(order.id, 'timeline:updated', {
      type: 'ORDER_IN_PROGRESS',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, orderId: order.id }, 'Failed to create in-progress event');
  }
});

on(EVENTS.ORDER_COMPLETED, async ({ order }) => {
  try {
    await prisma.event.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        type: 'ORDER_COMPLETED',
      },
    });

    broadcastToOrder(order.id, 'timeline:updated', {
      type: 'ORDER_COMPLETED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, orderId: order.id }, 'Failed to create completed event');
  }
});
