import express from 'express';
import { authMiddleware, tenantMiddleware } from '../middleware/auth.js';
import * as providerService from '../services/provider.js';

const router = express.Router();

// Get all providers
router.get('/', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const providers = await providerService.getProviders(req.tenantId);

    res.status(200).json({
      success: true,
      message: 'Providers retrieved',
      data: providers,
    });
  } catch (error) {
    next(error);
  }
});

// Get provider by ID
router.get('/:providerId', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const provider = await providerService.getProviderById(
      req.params.providerId,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Provider retrieved',
      data: provider,
    });
  } catch (error) {
    next(error);
  }
});

// Get provider orders
router.get('/:providerId/orders', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const status = req.query.status;
    const orders = await providerService.getProviderOrders(
      req.params.providerId,
      req.tenantId,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Provider orders retrieved',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

// Accept order
router.post('/:providerId/orders/:orderId/accept', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const order = await providerService.getProviderOrders(
      req.params.providerId,
      req.tenantId
    );

    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update order status
    const { updateOrderStatus } = await import('../services/order.js');
    const updatedOrder = await updateOrderStatus(
      req.params.orderId,
      'PROVIDER_ACCEPTED',
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Order accepted',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
