import bcrypt from 'bcryptjs';
import { prisma } from '../db/connection.js';
import { signToken } from '../utils/jwt.js';

export const AuthService = {
  /**
   * Register a new user.
   */
  async register(email, password, fullName, phone, role = 'resident') {
    const tenantId = 'green-valley';

    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        fullName: fullName || null,
        phone: phone || null,
        isActive: true,
      },
    });

    const roleMap = {
      resident: 'RESIDENT',
      manager: 'MANAGER',
      provider: 'PROVIDER_REP',
      worker: 'WORKER',
      admin: 'PLATFORM_ADMIN',
    };

    const prismaRole = roleMap[role];

    if (prismaRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          tenantId,
          role: prismaRole,
        },
      });
    }

    return user;
  },

  /**
   * Login using local bcrypt authentication.
   */
  async login(email, password, tenantId = 'green-valley') {
    console.log('LOGIN ATTEMPT:', {
      email,
      tenantId,
    });

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
      include: {
        roles: true,
        providers: true,
        providerEmployees: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const primaryRole = user.roles?.[0]?.role || 'RESIDENT';

    const token = signToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: primaryRole,
    });

    return {
      token,
      user,
    };
  },

  /**
   * Get current local CommunityOS user.
   */
  async getCurrentUser(userId) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        roles: true,
        providers: true,
        providerEmployees: true,
      },
    });
  },

  /**
   * Link an existing user to a provider.
   */
  async linkUser(supabaseUser, tenantId, roles = []) {
    const data = {
      id: supabaseUser.id,
      tenantId: tenantId || 'green-valley',
      email: supabaseUser.email,
      passwordHash: '',
      fullName:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        null,
      phone: supabaseUser.user_metadata?.phone || null,
      isActive: true,
    };

    const existing = await prisma.user.findUnique({
      where: {
        id: supabaseUser.id,
      },
    });

    if (!existing) {
      await prisma.user.create({
        data,
      });
    } else {
      await prisma.user.update({
        where: {
          id: supabaseUser.id,
        },
        data,
      });
    }

    for (const r of roles) {
      const exists = await prisma.userRole.findFirst({
        where: {
          userId: supabaseUser.id,
          role: r.role,
          resourceId: r.resourceId || null,
        },
      });

      if (!exists) {
        await prisma.userRole.create({
          data: {
            userId: supabaseUser.id,
            tenantId: tenantId || 'green-valley',
            role: r.role,
            resourceId: r.resourceId || null,
          },
        });
      }
    }

    return prisma.user.findUnique({
      where: {
        id: supabaseUser.id,
      },
    });
  },
};
