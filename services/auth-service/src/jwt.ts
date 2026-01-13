/**
 * JWT Token Utilities
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from './config.js';

export interface TokenPayload {
    id: string;
    phone: string;
    email?: string;
    type: 'access' | 'refresh';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
    const accessPayload: TokenPayload = { ...payload, type: 'access' };
    const refreshPayload: TokenPayload = { ...payload, type: 'refresh' };

    const accessOptions: SignOptions = {
        expiresIn: config.jwtExpiresIn as string,
        algorithm: 'HS256',
    };

    const refreshOptions: SignOptions = {
        expiresIn: config.refreshTokenExpiresIn as string,
        algorithm: 'HS256',
    };

    const accessToken = jwt.sign(accessPayload, config.jwtSecret, accessOptions);
    const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, refreshOptions);

    // Calculate expiry in seconds
    const decoded = jwt.decode(accessToken) as JwtPayload;
    const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;

    return {
        accessToken,
        refreshToken,
        expiresIn,
    };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Hash a refresh token for storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure OTP
 */
export function generateOtp(length: number = config.otpLength): string {
    const digits = '0123456789';
    let otp = '';

    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[randomBytes[i] % 10];
    }

    return otp;
}
