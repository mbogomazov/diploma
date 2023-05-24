import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor() {
        this.client = new Redis({
            // host: process.env.REDIS_HOST,
            // port: Number(process.env.REDIS_PORT),
            host: 'localhost',
            port: 6379
        });
    }

    async addTask(prompt: string): Promise<string> {
        const id = 'task:' + Date.now();

        await this.client.hset(id, { prompt, status: 'pending' });
        await this.client.lpush('taskQueue', id);

        return id;
    }

    async getTask(id: string): Promise<Record<string, string>> {
        const task = await this.client.hgetall(id);

        console.log(task);

        const result = {};

        for (const key in task) {
            result[key] = task[key].toString(); // Decoding binary data to string
        }

        return result;

    }
}