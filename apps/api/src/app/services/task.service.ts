import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class TaskService {

    constructor(private readonly redisService: RedisService) { }

    async addTask(prompt: string): Promise<{ id: string }> {
        const id = await this.redisService.addTask(`// Write javascript code\n${prompt}`);

        return { id };
    }

    async getTask(id: string): Promise<Record<string, string>> {
        const task = await this.redisService.getTask(id);

        return task;
    }
}