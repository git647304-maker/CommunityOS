import logger from '../config/logger.js';

export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      'Request completed'
    );
  });

  next();
}
