import express from 'express';
import authRouter from './auth.js';
import ordersRouter from './orders.js';
import servicesRouter from './services.js';
import providersRouter from './providers.js';
import communitiesRouter from './communities.js';
import devRouter from './dev.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRouter);
router.use('/orders', ordersRouter);
router.use('/services', servicesRouter);
router.use('/providers', providersRouter);
router.use('/communities', communitiesRouter);

// Mount dev-only routes when not in production
if (process.env.NODE_ENV !== 'production') {
  router.use('/dev', devRouter);
}

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

export default router;
