import express from 'express';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

router.post('/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not allowed in production.' });
    }

    const key = req.header('x-dev-seed-key') || req.query.key;
    if (!process.env.DEV_SEED_KEY || key !== process.env.DEV_SEED_KEY) {
      return res.status(401).json({ success: false, message: 'Missing or invalid DEV_SEED_KEY.' });
    }

    await seedDatabase();

    return res.json({ success: true, message: 'Seed ran successfully.' });
  } catch (err) {
    console.error('Dev seed failed:', err);
    return res.status(500).json({ success: false, message: 'Seed failed.', error: String(err?.message || err) });
  }
});

export default router;
