import express from 'express';

import {
  authMiddleware,
  roleMiddleware,
} from '../middleware/auth.js';

import {
  getProviders,
  getProviderById,
  getProviderOrders,
  acceptProviderOrder,
} from '../services/provider.js';

const router = express.Router();

/**
 * Provider dashboard
 *
 * Returns providers belonging to the logged-in tenant.
 */
router.get(
  '/dashboard',
  authMiddleware,
  requireRole(
    'PROVIDER_REP',
    'PROVIDER',
    'MANAGER',
    'ADMIN',
    'PLATFORM_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const providers = await getProviders(req.user.tenantId);

      res.json({
        success: true,
        data: {
          providers,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * List providers
 */
router.get(
  '/',
  authMiddleware,
  async (req, res, next) => {
    try {
      const providers = await getProviders(
        req.user.tenantId
      );

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get one provider
 */
router.get(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const provider = await getProviderById(
        req.params.id,
        req.user.tenantId
      );

      res.json({
        success: true,
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get provider orders
 *
 * Optional:
 * ?status=CREATED
 */
router.get(
  '/:providerId/orders',
  authMiddleware,
  requireRole(
    'PROVIDER_REP',
    'PROVIDER',
    'MANAGER',
    'ADMIN',
    'PLATFORM_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const {
        providerId,
      } = req.params;

      const {
        status,
      } = req.query;

      const orders = await getProviderOrders(
        providerId,
        req.user.tenantId,
        status || null
      );

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Accept an order
 *
 * POST:
 * /api/providers/:providerId/orders/:orderId/accept
 */
router.post(
  '/:providerId/orders/:orderId/accept',
  authMiddleware,
  requireRole(
    'PROVIDER_REP',
    'PROVIDER',
    'MANAGER',
    'ADMIN',
    'PLATFORM_ADMIN'
  ),
  async (req, res, next) => {
    try {
      const {
        providerId,
        orderId,
      } = req.params;

      const updatedOrder = await acceptProviderOrder(
        providerId,
        orderId,
        req.user.tenantId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;