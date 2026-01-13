/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface JwtPayload {
    id: string;
    phone: string;
    email?: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            requestId?: string;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            req.user = decoded;
            next();
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    error: 'Token Expired',
                    message: 'Your session has expired. Please login again.',
                });
                return;
            }

            if (jwtError instanceof jwt.JsonWebTokenError) {
                res.status(401).json({
                    error: 'Invalid Token',
                    message: 'The provided token is invalid.',
                });
                return;
            }

            throw jwtError;
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during authentication.',
        });
    }
};
