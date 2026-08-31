import express from 'express';
import { authMiddleware, tenantMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validation.js';
import * as authService from '../services/auth.js';
import { AppError } from '../utils/errors.js';
import logger from '../config/logger.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const data = validate(req.body, schemas.register);
    const result = await authService.registerUser(data);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = validate(req.body, schemas.login);
    const { tenantId } = req.body;

    if (!tenantId) {
      throw new AppError('tenantId is required', 400);
    }

    const result = await authService.loginUser(
      data.email,
      data.password,
      tenantId
    );
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
