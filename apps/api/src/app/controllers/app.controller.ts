import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { GetResultDto, GetTaskIdDto } from '@online-editor/types';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Post('add-task')
    async addTask(@Body('prompt') prompt: string): Promise<GetTaskIdDto> {
        return await this.appService.addTask(prompt);
    }

    @Get('get-status')
    async getTask(@Query('id') id: string): Promise<GetResultDto> {
        return await this.appService.getTask(id);
    }
}
