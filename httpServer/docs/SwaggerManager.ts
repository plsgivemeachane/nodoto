import swaggerUi from 'swagger-ui-express';
import { logger } from '../../utils/winston';
import { RequestHandler, Router } from 'express';

export interface SwaggerOptions {
    title: string;
    version: string;
    description?: string;
    basePath?: string;
}

export interface SwaggerEndpoint {
    path: string;
    method: string;
    summary: string;
    description?: string;
    parameters?: any[];
    requestBody?: any;
    responses?: Record<string, any>;
    tags?: string[];
    security?: any[];
}

export class SwaggerManager {
    private static instance: SwaggerManager;
    private spec: any;
    private endpoints: SwaggerEndpoint[] = [];

    private constructor() {}

    public static getInstance(): SwaggerManager {
        if (!SwaggerManager.instance) {
            SwaggerManager.instance = new SwaggerManager();
        }
        return SwaggerManager.instance;
    }

    public init(options: SwaggerOptions): void {
        this.spec = {
            openapi: '3.0.0',
            info: {
                title: options.title,
                version: options.version,
                description: options.description || ''
            },
            servers: [
                {
                    url: options.basePath || `http://localhost:${process.env.PORT || 3000}`,
                    description: 'API Server'
                }
            ],
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        };
        logger.info('[Swagger] Initialized');
    }

    public addEndpoint(endpoint: SwaggerEndpoint): void {
        this.endpoints.push(endpoint);
        const pathKey = endpoint.path;
        if (!this.spec.paths[pathKey]) {
            this.spec.paths[pathKey] = {};
        }
        const methodKey = endpoint.method.toLowerCase();
        this.spec.paths[pathKey][methodKey] = {
            summary: endpoint.summary,
            description: endpoint.description || '',
            parameters: endpoint.parameters || [],
            tags: endpoint.tags || [],
            responses: endpoint.responses || { '200': { description: 'Success' } }
        };
        if (endpoint.requestBody) {
            this.spec.paths[pathKey][methodKey].requestBody = endpoint.requestBody;
        }
        if (endpoint.security) {
            this.spec.paths[pathKey][methodKey].security = endpoint.security;
        }
    }

    public addSchema(name: string, schema: any): void {
        this.spec.components.schemas[name] = schema;
    }

    public getSpec(): any {
        return this.spec;
    }

    public getRouter(): Router {
        const router = Router();
        router.use('/', swaggerUi.serve);
        router.get('/', swaggerUi.setup(this.spec));
        router.get('/json', (_req, res) => {
            res.json(this.spec);
        });
        return router;
    }
}

export default SwaggerManager;
