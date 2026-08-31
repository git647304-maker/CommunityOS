import express from 'express';
import { authMiddleware, tenantMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validation.js';
import * as orderService from '../services/order.js';
import * as eventService from '../services/event.js';
import { generateIdempotencyKey } from '../utils/idempotency.js';
import logger from '../config/logger.js';

const router = express.Router();

// Create order
router.post('/', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const data = validate(req.body, schemas.createOrder);
    const idempotencyKey = data.idempotencyKey || generateIdempotencyKey();

    const order = await orderService.createOrder(
      { ...data, idempotencyKey },
      req.user.id,
      req.tenantId
    );

    // Create event
    await eventService.createEvent(
      req.tenantId,
      order.id,
      'ORDER_CREATED',
      req.user.id,
      { orderValue: order.total }
    );

    // Log audit
    await eventService.logAuditAction(
      req.tenantId,
      req.user.id,
      'CREATE',
      'ORDER',
      order.id,
      { total: order.total }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Get all orders for user
router.get('/', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await orderService.getOrdersByUser(
      req.user.id,
      req.tenantId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      message: 'Orders retrieved',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Get order by ID
router.get('/:orderId', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId, req.tenantId);

    res.status(200).json({
      success: true,
      message: 'Order retrieved',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Get order timeline
router.get('/:orderId/timeline', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const timeline = await eventService.getOrderTimeline(
      req.params.orderId,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Order timeline',
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch('/:orderId/status', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const data = validate(req.body, schemas.updateOrderStatus);
    const order = await orderService.updateOrderStatus(
      req.params.orderId,
      data.status,
      req.tenantId
    );

    // Create event
    await eventService.createEvent(
      req.tenantId,
      order.id,
      `ORDER_${data.status}`,
      req.user.id,
      {}
    );

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
