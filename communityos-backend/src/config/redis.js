
import { createClient } from 'redis';

let redisClient = null;

/**
 * In-memory Redis fallback for local development.
 * Used when Redis is not running locally.
 */
function createInMemoryRedisStub() {
  const kv = new Map();
  const hashes = new Map();

  return {
    // --------------------------------------------------
    // Lifecycle
    // --------------------------------------------------

    connect: async () => {},

    quit: async () => {},

    // --------------------------------------------------
    // Basic Redis commands
    // --------------------------------------------------

    ping: async () => 'PONG',

    get: async (key) => {
      const value = kv.get(String(key));

      return value === undefined ? null : value;
    },

    set: async (key, value) => {
      kv.set(String(key), String(value));

      return 'OK';
    },

    setEx: async (key, seconds, value) => {
      kv.set(String(key), String(value));

      // Development fallback does not implement
      // automatic expiration.
      return 'OK';
    },

    del: async (key) => {
      return kv.delete(String(key)) ? 1 : 0;
    },

    expire: async (key, seconds) => {
      // No real expiration in development fallback.
      return 1;
    },

    // --------------------------------------------------
    // Hash commands
    // --------------------------------------------------

    hGet: async (hash, field) => {
      const map = hashes.get(String(hash));

      if (!map) {
        return null;
      }

      const value = map.get(String(field));

      return value === undefined ? null : value;
    },

    hSet: async (hash, field, value) => {
      let map = hashes.get(String(hash));

      if (!map) {
        map = new Map();
        hashes.set(String(hash), map);
      }

      map.set(String(field), String(value));

      return 1;
    },

    // --------------------------------------------------
    // Pub/Sub
    // --------------------------------------------------

    publish: async () => 0,

    subscribe: async () => {},

    unsubscribe: async () => {},

    // --------------------------------------------------
    // Event listener compatibility
    // --------------------------------------------------

    on: () => {},
  };
}

/**
 * Initialize Redis.
 *
 * Development:
 * - Try Redis once.
 * - If Redis is unavailable, use the in-memory fallback.
 * - Do NOT continuously reconnect.
 *
 * Production:
 * - Redis is required.
 * - Connection failure throws an error.
 */
export async function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  const url =
    process.env.REDIS_URL || 'redis://localhost:6379';

  const isProduction =
    process.env.NODE_ENV === 'production';

  try {
    redisClient = createClient({
      url,

      socket: {
        /**
         * Prevent endless Redis reconnection attempts
         * during local development.
         */
        reconnectStrategy: (retries) => {
          if (!isProduction) {
            return false;
          }

          // Production retry strategy
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (error) => {
      console.error(
        'Redis client error:',
        error?.message || error
      );
    });

    await redisClient.connect();

    console.log('✓ Redis connected');

    return redisClient;
  } catch (error) {
    // --------------------------------------------------
    // Production
    // --------------------------------------------------

    if (isProduction) {
      console.error(
        'Redis connection failed:',
        error?.message || error
      );

      redisClient = null;

      throw error;
    }

    // --------------------------------------------------
    // Development fallback
    // --------------------------------------------------

    console.warn(
      '⚠ Redis not available. Using in-memory Redis fallback for development.'
    );

    redisClient = createInMemoryRedisStub();

    return redisClient;
  }
}

/**
 * Get the initialized Redis client.
 */
export function getRedisClient() {
  if (!redisClient) {
    throw new Error(
      'Redis not initialized. Call initializeRedis() first.'
    );
  }

  return redisClient;
}

/**
 * Close Redis connection.
 */
export async function closeRedis() {
  if (!redisClient) {
    return;
  }

  try {
    if (typeof redisClient.quit === 'function') {
      await redisClient.quit();
    }
  } catch (error) {
    console.error(
      'Error closing Redis:',
      error?.message || error
    );
  }

  redisClient = null;
}

