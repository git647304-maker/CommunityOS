import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errors.js';

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
}

export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  return authHeader.slice(7);
}
