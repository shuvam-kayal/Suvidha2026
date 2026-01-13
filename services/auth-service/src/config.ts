/**
 * Auth Service Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://suvidha:suvidha_secure_2026@localhost:5432/suvidha_db',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://:redis_secure_2026@localhost:6379',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'development_secret_change_in_production_min_32_chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    // OTP
    otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
    otpExpiresIn: parseInt(process.env.OTP_EXPIRES_IN || '300', 10), // 5 minutes in seconds

    // Rate Limiting
    otpMaxAttempts: 5,
    otpLockoutDuration: 900, // 15 minutes lockout after max attempts
};
