/**
 * SUVIDHA 2026 - API Gateway
 * Centralized entry point for all microservices
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept-Language'],
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        version: '1.0.0',
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        services: {
            auth: config.authServiceUrl,
            billing: config.billingServiceUrl,
            grievance: config.grievanceServiceUrl,
        },
    });
});

// =============================================================================
// PROXY CONFIGURATION
// =============================================================================

const proxyOptions = (target: string): Options => ({
    target,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/v1\/[^/]+/, ''),
    on: {
        proxyReq: (proxyReq, req) => {
            // Forward user info from JWT if available
            const user = (req as any).user;
            if (user) {
                proxyReq.setHeader('X-User-ID', user.id);
                proxyReq.setHeader('X-User-Phone', user.phone || '');
            }
            proxyReq.setHeader('X-Request-ID', (req as any).requestId || '');
        },
        error: (err, _req, res) => {
            logger.error('Proxy error:', err);
            (res as Response).status(502).json({ error: 'Service temporarily unavailable' });
        },
    },
});

// =============================================================================
// PUBLIC ROUTES (No Auth Required)
// =============================================================================

// Auth routes - no JWT required for login/register
app.use('/api/v1/auth', createProxyMiddleware(proxyOptions(config.authServiceUrl)));

// =============================================================================
// PROTECTED ROUTES (Auth Required)
// =============================================================================

// Apply auth middleware to protected routes
app.use('/api/v1/billing', authMiddleware, createProxyMiddleware(proxyOptions(config.billingServiceUrl)));
app.use('/api/v1/grievance', authMiddleware, createProxyMiddleware(proxyOptions(config.grievanceServiceUrl)));
app.use('/api/v1/user', authMiddleware, createProxyMiddleware(proxyOptions(config.authServiceUrl)));

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = config.port;

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger.info(`📡 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Auth Service: ${config.authServiceUrl}`);
    logger.info(`🔗 Billing Service: ${config.billingServiceUrl}`);
    logger.info(`🔗 Grievance Service: ${config.grievanceServiceUrl}`);
});

export default app;
