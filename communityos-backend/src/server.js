import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';

import apiRouter from './routes/index.js';
import { prisma } from './db/connection.js';
import { initializeSupabase } from './config/supabase.js';
import { initializeRedis, getRedisClient } from './config/redis.js';
import logger from './config/logger.js';
import { requestLogger, errorHandler } from './middleware/index.js';
import { on, EVENTS } from './utils/events.js';

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 3000);

// ==================================================
// ALLOWED CORS ORIGINS
// ==================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,

  // Production
  'https://community-os-klco.vercel.app',

  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5500',

  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
].filter(Boolean);

// ==================================================
// SECURITY MIDDLEWARE
// ==================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ==================================================
// CORS
// ==================================================

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin header
      // such as server-to-server requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(
        {
          origin,
          allowedOrigins,
        },
        'CORS origin not allowed'
      );

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    optionsSuccessStatus: 204,
  })
);

// ==================================================
// BODY / COOKIE / REQUEST MIDDLEWARE
// ==================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// ==================================================
// HEALTH CHECK
// ==================================================

app.get('/api/health', async (req, res) => {
  let database = 'unknown';
  let redis = 'unknown';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  try {
    const redisClient = getRedisClient();
    await redisClient.ping();
    redis = 'connected';
  } catch {
    redis = 'disconnected';
  }

  res.json({
    success: true,
    message: 'CommunityOS API is running',
    database,
    redis,
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// API ROUTES
// ==================================================

app.use('/api', apiRouter);

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================================================
// ERROR HANDLER
// ==================================================

app.use(errorHandler);

// ==================================================
// SOCKET.IO REAL-TIME
// ==================================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },

  transports: ['websocket', 'polling'],
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.info(
    { socketId: socket.id },
    'Socket connected'
  );

  // ----------------------------------------------
  // Track user connection
  // ----------------------------------------------

  socket.on('auth', (data) => {
    if (data?.userId) {
      connectedUsers.set(socket.id, data.userId);

      socket.userId = data.userId;
      socket.tenantId = data.tenantId;
    }
  });

  // ----------------------------------------------
  // Join order channel
  // ----------------------------------------------

  socket.on('join:order', (orderId) => {
    if (orderId) {
      socket.join(`order:${orderId}`);

      logger.info(
        {
          socketId: socket.id,
          orderId,
        },
        'Joined order channel'
      );
    }
  });

  // ----------------------------------------------
  // Leave order channel
  // ----------------------------------------------

  socket.on('leave:order', (orderId) => {
    if (orderId) {
      socket.leave(`order:${orderId}`);
    }
  });

  // ----------------------------------------------
  // Join provider channel
  // ----------------------------------------------

  socket.on('join:provider', (providerId) => {
    if (providerId) {
      socket.join(`provider:${providerId}`);

      logger.info(
        {
          socketId: socket.id,
          providerId,
        },
        'Joined provider channel'
      );
    }
  });

  // ----------------------------------------------
  // Join community channel
  // ----------------------------------------------

  socket.on('join:community', (communityId) => {
    if (communityId) {
      socket.join(`community:${communityId}`);

      logger.info(
        {
          socketId: socket.id,
          communityId,
        },
        'Joined community channel'
      );
    }
  });

  // ----------------------------------------------
  // Join tenant channel
  // ----------------------------------------------

  socket.on('join:tenant', (tenantId) => {
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
    }
  });

  // ----------------------------------------------
  // Disconnect
  // ----------------------------------------------

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);

    logger.info(
      { socketId: socket.id },
      'Socket disconnected'
    );
  });
});

// ==================================================
// BROADCAST HELPERS
// ==================================================

export function broadcastToOrder(orderId, event, data) {
  io.to(`order:${orderId}`).emit(event, data);
}

export function broadcastToProvider(providerId, event, data) {
  io.to(`provider:${providerId}`).emit(event, data);
}

export function broadcastToCommunity(communityId, event, data) {
  io.to(`community:${communityId}`).emit(event, data);
}

export function broadcastToTenant(tenantId, event, data) {
  io.to(`tenant:${tenantId}`).emit(event, data);
}

// ==================================================
// EVENT LISTENERS
// ==================================================

on(EVENTS.ORDER_CREATED, ({ order }) => {
  broadcastToTenant(
    order.tenantId,
    'order:created',
    order
  );

  if (order.communityId) {
    broadcastToCommunity(
      order.communityId,
      'order:created',
      order
    );
  }
});

on(EVENTS.ORDER_ACCEPTED, ({ order }) => {
  broadcastToOrder(
    order.id,
    'order:accepted',
    order
  );

  if (order.providerId) {
    broadcastToProvider(
      order.providerId,
      'order:accepted',
      order
    );
  }
});

on(EVENTS.ORDER_IN_PROGRESS, ({ order }) => {
  broadcastToOrder(
    order.id,
    'order:in_progress',
    order
  );
});

on(EVENTS.ORDER_COMPLETED, ({ order }) => {
  broadcastToOrder(
    order.id,
    'order:completed',
    order
  );
});

// ==================================================
// SERVER STARTUP
// ==================================================

async function startServer() {
  try {
    initializeSupabase();

    await initializeRedis();

    await prisma.$connect();

    server.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          origins: allowedOrigins.join(', '),
        },
        'CommunityOS Backend started'
      );

      console.log('');
      console.log('========================================');
      console.log('        COMMUNITYOS BACKEND');
      console.log('========================================');
      console.log(`API:     http://localhost:${PORT}`);
      console.log(
        `Health:  http://localhost:${PORT}/api/health`
      );
      console.log(
        `Frontend origins: ${allowedOrigins.join(', ')}`
      );
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    logger.error(
      { error },
      'Failed to start CommunityOS'
    );

    process.exit(1);
  }
}

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

async function shutdown(signal) {
  logger.info(
    { signal },
    'Shutdown signal received'
  );

  await prisma.$disconnect();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();