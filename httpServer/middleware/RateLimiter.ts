import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/winston';
import { routeFunction } from '../request/InjectableRequest';

export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}

export class RateLimiter {
    public static create(options: RateLimitOptions = {}): routeFunction {
        const limiter = rateLimit({
            windowMs: options.windowMs ?? 60 * 1000,
            max: options.max ?? 100,
            message: options.message ?? 'Too many requests, please try again later',
            standardHeaders: options.standardHeaders ?? true,
            legacyHeaders: options.legacyHeaders ?? false,
            handler: (req, res) => {
                logger.warn(`[RateLimit] Rate limit exceeded for ${req.ip} on ${req.method} ${req.url}`);
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: options.message ?? 'Too many requests, please try again later'
                });
            }
        });

        return (req, res) => {
            return new Promise<boolean>((resolve) => {
                limiter(req.getRequest() as any, res as any, () => {
                    resolve(true);
                });
            });
        };
    }
}

export default RateLimiter;
