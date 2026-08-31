import express from 'express';
import { initializeDb, getDb } from '../db/connection.js';
import { config } from '../config/env.js';
import { createClient } from 'redis';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // DB status
    await initializeDb();
    const prisma = getDb();
    await prisma.$queryRaw`SELECT 1`;

    // Redis status
    const redis = createClient({ url: config.REDIS_URL });
    await redis.connect();
    const pong = await redis.ping();
    await redis.disconnect();

    return res.json({ status: 'ok', env: config.NODE_ENV, db: 'ok', redis: pong === 'PONG' ? 'ok' : 'unavailable' });
  } catch (err) {
    console.error('Health check failed', err);
    return res.status(500).json({ status: 'fail', error: err?.message || String(err) });
  }
});

export default router;