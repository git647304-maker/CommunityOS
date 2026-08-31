import bcrypt from 'bcryptjs';
import { prisma } from '../db/connection.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticationError, AppError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Register a new CommunityOS user
 */
export async function registerUser(data) {
  const {
    email,
    password,
    full_name,
    phone,
    role = 'RESIDENT',
    tenantId = 'green-valley',
  } = data;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: normalizedEmail,
      },
    },
  });

  if (existingUser) {
    throw new AppError(
      'A user with this email already exists in this community',
      409
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      tenantId,
      email: normalizedEmail,
      passwordHash,
      fullName: full_name || null,
      phone: phone || null,

      roles: {
        create: {
          tenantId,
          role,
        },
      },
    },

    include: {
      roles: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    tenantId: user.tenantId,
    roles: user.roles,
  };
}

/**
 * Login a CommunityOS user
 */
export async function loginUser(email, password, tenantId) {
  if (!email || !password) {
    throw new AuthenticationError(
      'Email and password are required'
    );
  }

  if (!tenantId) {
    throw new AuthenticationError(
      'Community is required'
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: normalizedEmail,
      },
    },

    include: {
      roles: true,
      providers: true,
      providerEmployees: true,
    },
  });

  if (!user) {
    throw new AuthenticationError(
      'Invalid email, password, or community'
    );
  }

  if (!user.isActive) {
    throw new AuthenticationError(
      'This account is inactive'
    );
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new AuthenticationError(
      'Invalid email, password, or community'
    );
  }

  const primaryRole = user.roles[0]?.role || null;

  const token = signToken({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: primaryRole,
  });

  logger.info(
    {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: primaryRole,
    },
    'User logged in successfully'
  );

  return {
    token,

    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      tenantId: user.tenantId,
      role: primaryRole,
      roles: user.roles,
      providers: user.providers,
      providerEmployees: user.providerEmployees,
    },
  };
}

/**
 * Get current user
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    include: {
      roles: true,
      providers: true,
      providerEmployees: true,
    },
  });

  if (!user) {
    throw new AuthenticationError(
      'CommunityOS user not found'
    );
  }

  const primaryRole = user.roles[0]?.role || null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    tenantId: user.tenantId,
    role: primaryRole,
    roles: user.roles,
    providers: user.providers,
    providerEmployees: user.providerEmployees,
  };
}