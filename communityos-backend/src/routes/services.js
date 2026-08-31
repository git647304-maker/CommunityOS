import express from 'express';
import { authMiddleware, tenantMiddleware } from '../middleware/auth.js';
import * as serviceService from '../services/service.js';

const router = express.Router();

// Get all services
router.get('/', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const providerId = req.query.providerId;
    const services = await serviceService.getServices(req.tenantId, providerId);

    res.status(200).json({
      success: true,
      message: 'Services retrieved',
      data: services,
    });
  } catch (error) {
    next(error);
  }
});

// Get service by ID
router.get('/:serviceId', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const service = await serviceService.getServiceById(
      req.params.serviceId,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Service retrieved',
      data: service,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
