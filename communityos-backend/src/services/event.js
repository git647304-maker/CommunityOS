import { prisma } from '../db/connection.js';
import logger from '../config/logger.js';

export async function createEvent(tenantId, orderId, type, actorId, metadata) {
  const event = await prisma.event.create({
    data: {
      tenantId,
      orderId,
      type,
      actorId,
      metadata,
    },
  });

  return event;
}

export async function getOrderTimeline(orderId, tenantId) {
  const events = await prisma.event.findMany({
    where: {
      AND: [{ orderId }, { tenantId }],
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return events;
}

export async function logAuditAction(tenantId, userId, action, entity, entityId, metadata = {}) {
  const auditLog = await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      entity,
      entityId,
      metadata,
    },
  });

  logger.info(
    { auditLogId: auditLog.id, userId, action, entity },
    'Audit log created'
  );

  return auditLog;
}
