import { createClient, RedisClientOptions, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { logger } from '../../utils/winston';
import RedisClient from '@redis/client/dist/lib/client';

export default class RedisHelper {
    private static instance: RedisHelper;
    private client: RedisClient<RedisModules, RedisFunctions, RedisScripts> | undefined;

    private constructor() {}

    public static getInstance() {
        if (!RedisHelper.instance) {
            RedisHelper.instance = new RedisHelper();
        }
        return RedisHelper.instance;
    }

    createClient(opts: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> ) {
        this.client = createClient(opts);
        this.client.on('error', (err: any) => logger.error('Redis Client Error ' + JSON.stringify(err),));
    }

    async connect() {
        if(!this.client) {
            throw new Error('Redis client is not initialized');
        }
        
        await this.client.connect();
    }
}