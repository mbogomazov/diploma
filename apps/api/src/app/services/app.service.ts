import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { GetResultDto, GetTaskIdDto } from '@online-editor/types';

@Injectable()
export class AppService {
    constructor(private readonly redisService: RedisService) {}

    async addTask(prompt: string): Promise<GetTaskIdDto> {
        return await this.redisService.addTask(prompt);
    }

    async getTask(id: string): Promise<GetResultDto> {
        return await this.redisService.getTask(id);
    }
}
