import { Module } from '@nestjs/common';
import { TokenService } from './token.service.js';
import { RemoteModule } from '../remote/remote.module.js';

@Module({
    imports: [RemoteModule],
    providers: [TokenService],
    exports: [TokenService]
})
export class TokenModule {}
