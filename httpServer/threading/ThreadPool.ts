import { Worker } from 'worker_threads';
import path from 'path';
import { logger } from '../../utils/winston';

export interface TaskOptions {
    timeout?: number;
}

export interface TaskResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export class ThreadPool {
    private static instance: ThreadPool;
    private workers: Map<number, Worker> = new Map();
    private maxWorkers: number;

    private constructor(maxWorkers?: number) {
        this.maxWorkers = maxWorkers ?? 4;
    }

    public static getInstance(maxWorkers?: number): ThreadPool {
        if (!ThreadPool.instance) {
            ThreadPool.instance = new ThreadPool(maxWorkers);
        }
        return ThreadPool.instance;
    }

    public runTask<T = any>(workerFile: string, data: any, options: TaskOptions = {}): Promise<TaskResult<T>> {
        return new Promise((resolve) => {
            const workerPath = path.isAbsolute(workerFile) ? workerFile : path.resolve(workerFile);

            const worker = new Worker(workerPath, {
                workerData: data
            });

            const workerId = worker.threadId;
            this.workers.set(workerId, worker);

            const timeout = options.timeout ?? 30000;
            const timer = setTimeout(() => {
                worker.terminate();
                this.workers.delete(workerId);
                logger.warn(`[ThreadPool] Worker ${workerId} timed out after ${timeout}ms`);
                resolve({ success: false, error: 'Task timed out' });
            }, timeout);

            worker.on('message', (result: T) => {
                clearTimeout(timer);
                this.workers.delete(workerId);
                logger.verbose(`[ThreadPool] Worker ${workerId} completed task`);
                resolve({ success: true, data: result });
            });

            worker.on('error', (err: Error) => {
                clearTimeout(timer);
                this.workers.delete(workerId);
                logger.error(`[ThreadPool] Worker ${workerId} error: ${err.message}`);
                resolve({ success: false, error: err.message });
            });

            worker.on('exit', (code: number) => {
                clearTimeout(timer);
                this.workers.delete(workerId);
                if (code !== 0) {
                    logger.warn(`[ThreadPool] Worker ${workerId} exited with code ${code}`);
                    resolve({ success: false, error: `Worker exited with code ${code}` });
                }
            });
        });
    }

    public getActiveWorkerCount(): number {
        return this.workers.size;
    }

    public getMaxWorkers(): number {
        return this.maxWorkers;
    }

    public async terminateAll(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const [id, worker] of this.workers) {
            promises.push(worker.terminate().then(() => {
                this.workers.delete(id);
            }));
        }
        await Promise.all(promises);
        logger.info('[ThreadPool] All workers terminated');
    }
}

export default ThreadPool;
