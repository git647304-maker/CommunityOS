import express from 'express';
import { prisma } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/communities
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const communities = await prisma.community.findMany({
      where: {
        tenantId: req.user.tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: communities,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/communities/:id
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const community = await prisma.community.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
      },
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    res.json({
      success: true,
      data: community,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
