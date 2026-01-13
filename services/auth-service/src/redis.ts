/**
 * Redis Client for OTP Storage and Session Management
 */

import { createClient, RedisClientType } from 'redis';
import { config } from './config.js';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    redisClient = createClient({
        url: config.redisUrl,
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
    });

    redisClient.on('connect', () => {
        console.log('✅ Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
}

// =============================================================================
// OTP OPERATIONS
// =============================================================================

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const SESSION_PREFIX = 'session:';

/**
 * Store OTP in Redis with expiration
 */
export async function storeOtp(phoneNumber: string, otp: string): Promise<void> {
    const client = await getRedisClient();
    const key = `${OTP_PREFIX}${phoneNumber}`;

    await client.set(key, otp, {
        EX: config.otpExpiresIn,
    });
}

/**
 * Verify OTP and delete on success
 */
export async function verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const client = await getRedisClient();
    const key = `${OTP_PREFIX}${phoneNumber}`;

    const storedOtp = await client.get(key);

    if (!storedOtp) {
        return false; // OTP expired or doesn't exist
    }

    if (storedOtp === otp) {
        // Delete OTP after successful verification
        await client.del(key);
        // Reset attempt counter
        await client.del(`${OTP_ATTEMPTS_PREFIX}${phoneNumber}`);
        return true;
    }

    // Increment failed attempts
    await incrementOtpAttempts(phoneNumber);
    return false;
}

/**
 * Track failed OTP attempts for rate limiting
 */
export async function incrementOtpAttempts(phoneNumber: string): Promise<number> {
    const client = await getRedisClient();
    const key = `${OTP_ATTEMPTS_PREFIX}${phoneNumber}`;

    const attempts = await client.incr(key);

    // Set expiry on first attempt
    if (attempts === 1) {
        await client.expire(key, config.otpLockoutDuration);
    }

    return attempts;
}

/**
 * Check if user is locked out from OTP attempts
 */
export async function isOtpLocked(phoneNumber: string): Promise<boolean> {
    const client = await getRedisClient();
    const key = `${OTP_ATTEMPTS_PREFIX}${phoneNumber}`;

    const attempts = await client.get(key);
    return attempts !== null && parseInt(attempts, 10) >= config.otpMaxAttempts;
}

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

/**
 * Store refresh token hash in Redis
 */
export async function storeSession(
    userId: string,
    refreshTokenHash: string,
    expiresInSeconds: number
): Promise<void> {
    const client = await getRedisClient();
    const key = `${SESSION_PREFIX}${userId}:${refreshTokenHash.slice(0, 16)}`;

    await client.set(key, JSON.stringify({
        refreshTokenHash,
        createdAt: new Date().toISOString(),
    }), {
        EX: expiresInSeconds,
    });
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(userId: string, tokenPrefix: string): Promise<void> {
    const client = await getRedisClient();
    const key = `${SESSION_PREFIX}${userId}:${tokenPrefix}`;
    await client.del(key);
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
    const client = await getRedisClient();
    const pattern = `${SESSION_PREFIX}${userId}:*`;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
        await client.del(keys);
    }
}
