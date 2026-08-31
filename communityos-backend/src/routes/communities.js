import express from 'express';
import { authMiddleware, tenantMiddleware } from '../middleware/auth.js';
import * as communityService from '../services/community.js';

const router = express.Router();

// Get all communities
router.get('/', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const communities = await communityService.getCommunities(req.tenantId);

    res.status(200).json({
      success: true,
      message: 'Communities retrieved',
      data: communities,
    });
  } catch (error) {
    next(error);
  }
});

// Get community by ID
router.get('/:communityId', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const community = await communityService.getCommunityById(
      req.params.communityId,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Community retrieved',
      data: community,
    });
  } catch (error) {
    next(error);
  }
});

// Get community overview
router.get('/:communityId/overview', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const overview = await communityService.getCommunityOverview(
      req.params.communityId,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Community overview',
      data: overview,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
