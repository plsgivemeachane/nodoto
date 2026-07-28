import { logger } from '../../utils/winston';
import NResponse from '../request/wrapper/NResponse';
import { AppError } from './AppError';

export class ErrorHandler {
    public static handle(error: Error | AppError, res?: NResponse): void {
        if (error instanceof AppError) {
            logger.warn(`[ErrorHandler] Operational error: ${error.message} (${error.statusCode})`);
            if (res && !res.isClosedYet()) {
                res.json({ error: error.message, status: error.statusCode }, error.statusCode);
                res.dispatch();
            }
            return;
        }

        // Unexpected error
        logger.error(`[ErrorHandler] Unexpected error: ${error.message}\n${error.stack}`);
        if (res && !res.isClosedYet()) {
            const isDev = process.env.NODE_ENV !== 'production';
            res.json({
                error: 'Internal Server Error',
                ...(isDev && { detail: error.message })
            }, 500);
            res.dispatch();
        }
    }

    public static middleware() {
        return (err: Error, res: NResponse) => {
            this.handle(err, res);
        };
    }
}

export default ErrorHandler;
