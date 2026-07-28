import Joi from 'joi';
import { logger } from '../../utils/winston';
import NRequest from '../request/wrapper/NRequest';
import NResponse from '../request/wrapper/NResponse';
import { routeFunction } from '../request/InjectableRequest';

export type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

export interface ValidationSchema {
    body?: Joi.Schema;
    query?: Joi.Schema;
    params?: Joi.Schema;
    headers?: Joi.Schema;
}

export class Validator {
    public static validate(schema: ValidationSchema): routeFunction {
        return (req: NRequest, res: NResponse) => {
            const expressReq = req.getRequest();
            const targets: ValidationTarget[] = ['body', 'query', 'params', 'headers'];

            for (const target of targets) {
                const targetSchema = schema[target];
                if (!targetSchema) continue;

                const data = expressReq[target];
                const { error, value } = targetSchema.validate(data, {
                    abortEarly: false,
                    stripUnknown: true
                });

                if (error) {
                    const details = error.details.map(d => d.message).join(', ');
                    logger.warn(`[Validator] Validation failed for ${target}: ${details}`);
                    res.json({
                        error: 'Validation Error',
                        target,
                        details: error.details.map(d => ({
                            field: d.path.join('.'),
                            message: d.message
                        }))
                    }, 400);
                    return false;
                }

                expressReq[target] = value;
            }

            return true;
        };
    }
}

export default Validator;
