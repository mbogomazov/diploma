import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { TaskService } from '../services/task.service';

@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Post('add')
    async addTask(@Body('prompt') prompt: string): Promise<{ id: string }> {
        return await this.taskService.addTask(prompt);
    }

    @Get('get-status')
    async getTask(@Query('id') id: string): Promise<any> {
        return await this.taskService.getTask(id);
    }
}