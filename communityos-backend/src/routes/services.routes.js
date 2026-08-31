import express from 'express';
import { prisma } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/services
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
  where: {
    tenantId: req.user.tenantId,
  },
  orderBy: {
    name: 'asc',
  },
});

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/services/:id
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
  where: {
    id: req.params.id,
    tenantId: req.user.tenantId,
  },
});
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
});

export default router;