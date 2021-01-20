import { Module } from '@nestjs/common';
import { ExternalIdService } from './external.id.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';

@Module({
    imports: [TypeOrmModule.forFeature([ExternalId])],
    providers: [ExternalIdService],
    exports: [ExternalIdService]
})
export class DbModule {}
