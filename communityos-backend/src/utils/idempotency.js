import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../config/redis.js';

export function generateIdempotencyKey() {
  return uuidv4();
}

export async function checkIdempotency(key) {
  if (!key) {
    return null;
  }

  const redis = getRedisClient();

  const existing = await redis.get(
    `idempotency:${key}`
  );

  if (!existing) {
    return null;
  }

  try {
    return JSON.parse(existing);
  } catch (error) {
    console.error(
      'Failed to parse idempotency result:',
      error
    );

    return null;
  }
}

export async function storeIdempotencyResult(
  key,
  result,
  ttl = 3600
) {
  if (!key) {
    return;
  }

  const redis = getRedisClient();

  await redis.setEx(
    `idempotency:${key}`,
    ttl,
    JSON.stringify(result)
  );
}
