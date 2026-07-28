import bcrypt from 'bcrypt';
import { JWT } from 'quanvnjwt';
import dotenv from 'dotenv';
import { logger } from '../../utils/winston';
import NRequest from '../request/wrapper/NRequest';
import NResponse from '../request/wrapper/NResponse';
import { User } from './rbac/types';
import { routeFunction } from '../request/InjectableRequest';

dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'nodoto-default-secret-change-me';

export class AuthManager {
    /**
     * Hash a password using bcrypt.
     * Called automatically by auth middleware when registering users.
     */
    public static async hashPassword(plain: string): Promise<string> {
        return bcrypt.hash(plain, SALT_ROUNDS);
    }

    /**
     * Verify a password against a bcrypt hash.
     * Called automatically by auth middleware when logging in.
     */
    public static async verifyPassword(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }

    /**
     * Generate a JWT token for a user.
     */
    public static generateToken(user: User): string {
        const jwt = new JWT(JWT_SECRET);
        return jwt.sign({
            id: user.id,
            username: user.username,
            roles: user.roles
        });
    }

    /**
     * Verify a JWT token and return the decoded payload.
     */
    public static verifyToken(token: string): any | null {
        try {
            const jwt = new JWT(JWT_SECRET);
            return jwt.verify(token);
        } catch {
            return null;
        }
    }

    /**
     * Middleware: automatically handles JWT authentication.
     * Extracts token from Authorization header, verifies it, and sets user on request.
     * If no token or invalid token, returns 401.
     */
    public static jwtAuth(): routeFunction {
        return async (req: NRequest, res: NResponse) => {
            const authHeader = req.getRequest().headers.authorization;
            if (!authHeader) {
                res.json({ error: 'No token provided' }, 401);
                return false;
            }

            const decoded = AuthManager.verifyToken(authHeader);
            if (!decoded) {
                res.json({ error: 'Invalid token' }, 401);
                return false;
            }

            req.setUser({
                id: decoded.id,
                username: decoded.username,
                roles: decoded.roles
            });
            return true;
        };
    }

    /**
     * Middleware: registers a user with automatic password hashing.
     * Expects body: { username, password, roles? }
     * Automatically hashes the password and attaches the hash to req.body.password.
     * Also generates a JWT token and sets it on the response.
     */
    public static register(): routeFunction {
        return async (req: NRequest, res: NResponse) => {
            const body = req.getRequest().body;
            if (!body.username || !body.password) {
                res.json({ error: 'Username and password required' }, 400);
                return false;
            }

            // Automatically hash the password
            body.password = await AuthManager.hashPassword(body.password);
            body.roles = body.roles || ['viewer'];

            // Generate token
            const user: User = {
                id: Date.now().toString(),
                username: body.username,
                roles: body.roles
            };
            const token = AuthManager.generateToken(user);

            // Attach token to response body
            body._token = token;
            body._user = { id: user.id, username: user.username, roles: user.roles };

            logger.info(`[Auth] User registered: ${user.username}`);
            return true;
        };
    }

    /**
     * Middleware: login with automatic password verification.
     * Expects body: { username, password }
     * Expects req.body._storedHash to be set by a prior middleware (e.g. database lookup).
     * Verifies the password and generates a JWT token.
     */
    public static login(): routeFunction {
        return async (req: NRequest, res: NResponse) => {
            const body = req.getRequest().body;
            if (!body.username || !body.password) {
                res.json({ error: 'Username and password required' }, 400);
                return false;
            }

            if (!body._storedHash) {
                res.json({ error: 'User not found' }, 404);
                return false;
            }

            const valid = await AuthManager.verifyPassword(body.password, body._storedHash);
            if (!valid) {
                res.json({ error: 'Invalid credentials' }, 401);
                return false;
            }

            // Generate token
            const user: User = {
                id: body._userId || Date.now().toString(),
                username: body.username,
                roles: body._roles || ['viewer']
            };
            const token = AuthManager.generateToken(user);

            res.send({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, roles: user.roles }
            });
            return false; // Stop chain, response sent
        };
    }
}

export default AuthManager;
