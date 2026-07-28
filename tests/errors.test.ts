import {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError
} from '../httpServer/errors/AppError';

describe('Error Classes', () => {
    describe('AppError', () => {
        it('should create with default values', () => {
            const err = new AppError('Test error');
            expect(err.message).toBe('Test error');
            expect(err.statusCode).toBe(500);
            expect(err.isOperational).toBe(true);
            expect(err).toBeInstanceOf(Error);
        });

        it('should create with custom status code', () => {
            const err = new AppError('Custom', 418);
            expect(err.statusCode).toBe(418);
        });
    });

    describe('ValidationError', () => {
        it('should have 400 status code', () => {
            const err = new ValidationError('Invalid input');
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Invalid input');
            expect(err).toBeInstanceOf(AppError);
        });
    });

    describe('UnauthorizedError', () => {
        it('should have 401 status code', () => {
            const err = new UnauthorizedError();
            expect(err.statusCode).toBe(401);
            expect(err.message).toBe('Unauthorized');
        });

        it('should accept custom message', () => {
            const err = new UnauthorizedError('Token expired');
            expect(err.message).toBe('Token expired');
        });
    });

    describe('ForbiddenError', () => {
        it('should have 403 status code', () => {
            const err = new ForbiddenError();
            expect(err.statusCode).toBe(403);
        });
    });

    describe('NotFoundError', () => {
        it('should have 404 status code', () => {
            const err = new NotFoundError('User not found');
            expect(err.statusCode).toBe(404);
            expect(err.message).toBe('User not found');
        });
    });

    describe('ConflictError', () => {
        it('should have 409 status code', () => {
            const err = new ConflictError('Email already exists');
            expect(err.statusCode).toBe(409);
        });
    });

    describe('RateLimitError', () => {
        it('should have 429 status code', () => {
            const err = new RateLimitError();
            expect(err.statusCode).toBe(429);
        });
    });
});
