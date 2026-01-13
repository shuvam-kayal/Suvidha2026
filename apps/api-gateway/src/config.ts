/**
 * API Gateway Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),

    // Service URLs
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    billingServiceUrl: process.env.BILLING_SERVICE_URL || 'http://localhost:3002',
    grievanceServiceUrl: process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3003',

    // CORS
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:5173',  // Kiosk UI dev
        'http://localhost:5174',  // Admin Portal dev
        'http://localhost:8080',  // Kiosk UI prod
        'http://localhost:8081',  // Admin Portal prod
    ],

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'development_secret_change_in_production',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
