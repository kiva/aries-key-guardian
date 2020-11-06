import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { RemoteModule } from '../remote/remote.module';

@Module({
    imports: [RemoteModule],
    providers: [TokenService],
    exports: [TokenService]
})
export class TokenModule {}
