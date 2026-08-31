import { verifyToken, extractToken } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';
import logger from '../config/logger.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    const decoded = verifyToken(token);

    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    logger.warn({ error: error.message }, 'Authentication failed');
    res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
}

export function tenantMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  req.tenantId = req.user.tenantId;
  next();
}

export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        { userId: req.user.id, userRole, allowedRoles },
        'Authorization failed'
      );
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

export function errorHandler(err, req, res, next) {
  logger.error({ error: err }, 'Request error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
