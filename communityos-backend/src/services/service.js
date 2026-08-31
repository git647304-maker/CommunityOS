import { prisma } from '../db/connection.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

export async function getServices(tenantId, providerId = null) {
  const where = { tenantId };
  if (providerId) {
    where.providerId = providerId;
  }

  const services = await prisma.service.findMany({
    where,
    include: {
      provider: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  return services;
}

export async function getServiceById(serviceId, tenantId) {
  const service = await prisma.service.findFirst({
    where: {
      AND: [{ id: serviceId }, { tenantId }],
    },
    include: {
      provider: true,
    },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  return service;
}

export async function createService(data, tenantId) {
  const { providerId, name, description, unitPrice, serviceType } = data;

  const service = await prisma.service.create({
    data: {
      tenantId,
      providerId,
      name,
      description,
      unitPrice,
      serviceType,
    },
    include: {
      provider: true,
    },
  });

  logger.info({ serviceId: service.id, name }, 'Service created');

  return service;
}
