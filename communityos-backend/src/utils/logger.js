import pino from 'pino';
import { config } from '../config/env.js';

const isDevelopment = config.NODE_ENV !== 'production';

const logger = pino(
  {
    level: config.LOG_LEVEL || 'info',

    base: {
      service: 'communityos-backend',
    },

    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
  }
);

export default logger;
