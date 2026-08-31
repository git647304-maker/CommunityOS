import express from 'express';

import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getUserId(req) {
  return req.user?.id;
}

function getTenantId(req) {
  return req.user?.tenantId;
}

function getRoleNames(req) {
  if (!Array.isArray(req.user?.roles)) {
    return [];
  }

  return req.user.roles.map((role) => {
    if (typeof role === 'string') return role;
    return role.role || role.name;
  });
}

function hasRole(req, roles) {
  const userRoles = getRoleNames(req);
  return roles.some((role) => userRoles.includes(role));
}

/*
|--------------------------------------------------------------------------
| GET /api/orders
|
| Resident:
|   sees own orders
|
| Provider:
|   sees provider orders
|
| Manager/Admin:
|   sees tenant orders
|--------------------------------------------------------------------------
*/

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const tenantId = getTenantId(req);

    if (!userId || !tenantId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with a CommunityOS tenant',
      });
    }

    const where = {
      tenantId,
    };

    if (hasRole(req, ['RESIDENT'])) {
      where.residentId = userId;
    }

    if (hasRole(req, ['PROVIDER_REP', 'PROVIDER'])) {
      const providerId = req.user.providerId;

      if (!providerId) {
        return res.json({
          success: true,
          data: [],
        });
      }

      where.providerId = providerId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        resident: true,
        provider: true,
        community: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/orders
|--------------------------------------------------------------------------
*/

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const tenantId = getTenantId(req);

    if (!userId || !tenantId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with a CommunityOS tenant',
      });
    }

    const {
      communityId,
      providerId,
      items,
      idempotencyKey,
      notes,
    } = req.body;

    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: 'communityId is required',
      });
    }

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'providerId is required',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one order item is required',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify community
    |--------------------------------------------------------------------------
    */

    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        tenantId,
      },
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify provider
    |--------------------------------------------------------------------------
    */

    const provider = await prisma.provider.findFirst({
      where: {
        id: providerId,
        tenantId,
      },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Idempotency
    |--------------------------------------------------------------------------
    */

    if (idempotencyKey) {
      const existing = await prisma.order.findFirst({
        where: {
          tenantId,
          idempotencyKey,
        },
        include: {
          items: true,
          provider: true,
          community: true,
        },
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing,
          duplicate: true,
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Validate items
    |--------------------------------------------------------------------------
    */

    const serviceIds = items
      .map((item) => item.serviceId)
      .filter(Boolean);

    if (serviceIds.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Every order item must contain a serviceId',
      });
    }

    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
        tenantId,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected services are unavailable',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate total
    |--------------------------------------------------------------------------
    */

    let total = 0;

    const orderItems = items.map((item) => {
      const service = services.find(
        (entry) => entry.id === item.serviceId
      );

      const quantity = Math.max(
        1,
        Number(item.quantity || 1)
      );

      const unitPrice = Number(service.price || 0);

      const subtotal = unitPrice * quantity;

      total += subtotal;

      return {
        serviceId: service.id,
        quantity,
        unitPrice,
        subtotal,
      };
    });

    /*
    |--------------------------------------------------------------------------
    | Create order
    |--------------------------------------------------------------------------
    */

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          communityId,
          residentId: userId,
          providerId,
          status: 'CREATED',
          total,
          notes: notes || null,
          idempotencyKey: idempotencyKey || null,

          items: {
            create: orderItems,
          },
        },

        include: {
          items: {
            include: {
              service: true,
            },
          },
          community: true,
          provider: true,
        },
      });

      await tx.event.create({
        data: {
          tenantId,
          orderId: createdOrder.id,
          type: 'ORDER_CREATED',
          actorId: userId,
          metadata: {
            total,
            itemCount: orderItems.length,
          },
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/orders/:orderId
|--------------------------------------------------------------------------
*/

router.get(
  '/:orderId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const tenantId = getTenantId(req);

      const order = await prisma.order.findFirst({
        where: {
          id: req.params.orderId,
          tenantId,
        },

        include: {
          items: {
            include: {
              service: true,
            },
          },
          community: true,
          provider: true,
          resident: true,
          events: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Resource authorization
      |--------------------------------------------------------------------------
      */

      const allowed =
        hasRole(req, ['ADMIN', 'MANAGER']) ||
        order.residentId === userId ||
        (
          hasRole(req, ['PROVIDER_REP', 'PROVIDER']) &&
          order.providerId === req.user.providerId
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET /api/orders/:orderId/timeline
|--------------------------------------------------------------------------
*/

router.get(
  '/:orderId/timeline',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const tenantId = getTenantId(req);

      const order = await prisma.order.findFirst({
        where: {
          id: req.params.orderId,
          tenantId,
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      const allowed =
        hasRole(req, ['ADMIN', 'MANAGER']) ||
        order.residentId === userId ||
        (
          hasRole(req, ['PROVIDER_REP', 'PROVIDER']) &&
          order.providerId === req.user.providerId
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this timeline',
        });
      }

      const events = await prisma.event.findMany({
        where: {
          orderId: order.id,
          tenantId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/:orderId/status
|
| Provider / Manager / Admin can update order status.
|--------------------------------------------------------------------------
*/

router.patch(
  '/:orderId/status',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const tenantId = getTenantId(req);
      const { status } = req.body;

      const allowedStatuses = [
        'CREATED',
        'PROVIDER_ACCEPTED',
        'WORKER_ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status',
        });
      }

      const order = await prisma.order.findFirst({
        where: {
          id: req.params.orderId,
          tenantId,
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      const canUpdate =
        hasRole(req, ['ADMIN', 'MANAGER']) ||
        (
          hasRole(req, ['PROVIDER_REP', 'PROVIDER']) &&
          order.providerId === req.user.providerId
        );

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You cannot update this order',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: {
            id: order.id,
          },
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
            community: true,
          },
        });

        await tx.event.create({
          data: {
            tenantId,
            orderId: order.id,
            type: `ORDER_${status}`,
            actorId: userId,
            metadata: {
              previousStatus: order.status,
              newStatus: status,
            },
          },
        });

        return updatedOrder;
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
