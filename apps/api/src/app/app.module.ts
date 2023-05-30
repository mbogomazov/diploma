import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { RedisService } from './services/redis.service';

@Module({
    imports: [],
    controllers: [AppController],
    providers: [AppService, RedisService],
})
export class AppModule {}
