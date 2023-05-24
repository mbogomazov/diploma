import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { TaskController } from './controllers/task.controller';
import { RedisService } from './services/redis.service';
import { TaskService } from './services/task.service';


@Module({
    imports: [],
    controllers: [AppController, TaskController],
    providers: [AppService, RedisService, TaskService],
})
export class AppModule { }
