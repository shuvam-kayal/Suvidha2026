/**
 * Auth Service - User Authentication & OTP Management
 * SUVIDHA 2026 - C-DAC Hackathon
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import { storeOtp, verifyOtp, isOtpLocked, storeSession, invalidateSession, getRedisClient } from './redis.js';
import { generateOtp, generateTokenPair, verifyToken, hashToken } from './jwt.js';

const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', async (_req: Request, res: Response) => {
    let redisStatus = 'disconnected';
    try {
        const client = await getRedisClient();
        await client.ping();
        redisStatus = 'connected';
    } catch {
        redisStatus = 'error';
    }

    res.json({
        status: 'healthy',
        service: 'auth-service',
        redis: redisStatus,
        timestamp: new Date().toISOString(),
    });
});

// =============================================================================
// OTP REQUEST
// =============================================================================

app.post('/otp/request', async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;

        // Validation
        if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                error: 'Invalid phone number',
                message: 'Please enter a valid 10-digit Indian mobile number',
            });
        }

        // Check if user is locked out
        const locked = await isOtpLocked(phoneNumber);
        if (locked) {
            return res.status(429).json({
                error: 'Too many attempts',
                message: 'Please wait 15 minutes before requesting another OTP',
            });
        }

        // Generate and store OTP
        const otp = generateOtp();
        await storeOtp(phoneNumber, otp);

        // In development, log OTP to console
        if (config.nodeEnv === 'development') {
            console.log(`\n📱 [DEV] OTP for ${phoneNumber}: ${otp}\n`);
        }

        // TODO: In production, send OTP via SMS gateway

        res.json({
            success: true,
            message: 'OTP sent successfully',
            expiresIn: config.otpExpiresIn,
            // Only include OTP in development for testing
            ...(config.nodeEnv === 'development' && { _devOtp: otp }),
        });
    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// =============================================================================
// OTP VERIFICATION & LOGIN
// =============================================================================

app.post('/otp/verify', async (req: Request, res: Response) => {
    try {
        const { phoneNumber, otp } = req.body;

        // Validation
        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ error: 'Invalid OTP format' });
        }

        // Check lockout
        const locked = await isOtpLocked(phoneNumber);
        if (locked) {
            return res.status(429).json({
                error: 'Account locked',
                message: 'Too many failed attempts. Please wait 15 minutes.',
            });
        }

        // Verify OTP
        const isValid = await verifyOtp(phoneNumber, otp);
        if (!isValid) {
            return res.status(401).json({
                error: 'Invalid or expired OTP',
                message: 'Please check the OTP or request a new one',
            });
        }

        // TODO: Check if user exists in database, create if not
        // For now, generate a mock user ID
        const userId = `user_${phoneNumber.slice(-4)}_${Date.now().toString(36)}`;

        // Generate JWT tokens
        const tokens = generateTokenPair({
            id: userId,
            phone: phoneNumber,
        });

        // Store session in Redis
        const refreshTokenHash = hashToken(tokens.refreshToken);
        const refreshExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
        await storeSession(userId, refreshTokenHash, refreshExpiresIn);

        res.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                id: userId,
                phoneNumber,
                name: null, // User can update profile later
                email: null,
                isNewUser: true, // TODO: Check from database
            },
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// =============================================================================
// GET CURRENT USER
// =============================================================================

app.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);

        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (payload.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // TODO: Fetch user from database
        res.json({
            id: payload.id,
            phoneNumber: payload.phone,
            email: payload.email || null,
            name: null, // TODO: Fetch from database
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// =============================================================================
// REFRESH TOKEN
// =============================================================================

app.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const payload = verifyToken(refreshToken);

        if (!payload || payload.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new token pair
        const tokens = generateTokenPair({
            id: payload.id,
            phone: payload.phone,
            email: payload.email,
        });

        // Update session
        const newRefreshTokenHash = hashToken(tokens.refreshToken);
        const refreshExpiresIn = 7 * 24 * 60 * 60;
        await storeSession(payload.id, newRefreshTokenHash, refreshExpiresIn);

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// =============================================================================
// LOGOUT
// =============================================================================

app.post('/logout', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = verifyToken(token);

            if (payload) {
                // Invalidate session
                const tokenHash = hashToken(token);
                await invalidateSession(payload.id, tokenHash.slice(0, 16));
            }
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        // Still return success even if session invalidation fails
        res.json({ success: true, message: 'Logged out' });
    }
});

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.nodeEnv === 'development' ? err.message : undefined,
    });
});

// =============================================================================
// START SERVER
// =============================================================================

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`\n🔐 Auth Service running on port ${PORT}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`⏱️  OTP expires in: ${config.otpExpiresIn} seconds\n`);
});

export default app;
