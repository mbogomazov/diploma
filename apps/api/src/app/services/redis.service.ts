import { Injectable } from '@nestjs/common';
import { GetResultDto, GetTaskIdDto } from '@online-editor/types';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor() {
        this.client = new Redis(process.env.REDIS_URL);
    }

    async addTask(prompt: string): Promise<GetTaskIdDto> {
        const id = 'task:' + Date.now();

        await this.client.hset(id, { prompt, status: 'pending' });
        await this.client.lpush('taskQueue', id);

        return { id };
    }

    async getTask(id: string): Promise<GetResultDto> {
        const task = (await this.client.hgetall(id)) as GetResultDto;

        if (!('status' in task)) {
            throw new Error('Invalid task data');
        }

        return task;
    }
}
