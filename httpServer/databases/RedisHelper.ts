import { createClient, RedisClientOptions } from 'redis';
import { logger } from '../../utils/winston';

export default class RedisHelper {
    private static instance: RedisHelper;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private client: any = null;
    private connected: boolean = false;

    private constructor() {}

    public static getInstance(): RedisHelper {
        if (!RedisHelper.instance) {
            RedisHelper.instance = new RedisHelper();
        }
        return RedisHelper.instance;
    }

    public async connect(opts?: RedisClientOptions): Promise<void> {
        if (this.connected && this.client) {
            logger.verbose('[Redis] Already connected');
            return;
        }

        this.client = createClient(opts);
        this.client.on('error', (err: Error) => {
            logger.error(`[Redis] Client Error: ${err.message}`);
        });

        await this.client.connect();
        this.connected = true;
        logger.info('[Redis] Connected successfully');
    }

    public async disconnect(): Promise<void> {
        if (!this.client || !this.connected) {
            return;
        }
        await this.client.quit();
        this.connected = false;
        logger.info('[Redis] Disconnected');
    }

    public async get(key: string): Promise<string | null> {
        if (!this.client) throw new Error('[Redis] Client not initialized. Call connect() first.');
        return this.client.get(key);
    }

    public async set(key: string, value: string, expire?: number): Promise<void> {
        if (!this.client) throw new Error('[Redis] Client not initialized. Call connect() first.');
        if (expire) {
            await this.client.set(key, value, { EX: expire });
        } else {
            await this.client.set(key, value);
        }
    }

    public async del(key: string): Promise<void> {
        if (!this.client) throw new Error('[Redis] Client not initialized. Call connect() first.');
        await this.client.del(key);
    }

    public async exists(key: string): Promise<boolean> {
        if (!this.client) throw new Error('[Redis] Client not initialized. Call connect() first.');
        const result = await this.client.exists(key);
        return result === 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getClient(): any {
        return this.client;
    }

    public isConnected(): boolean {
        return this.connected;
    }
}
