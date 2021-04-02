import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { VerifyDto } from './dto/verify.dto';
import { CreateDto } from './dto/create.dto';
import { AddDto } from './dto/add.dto';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';

/**
 * Endpoints for our escrow service
 * @tothink in our AuthService we validated device details so we could know which fingerprint device was being used, we may want
 *          keep that functionality around, but it's fingerprint specific
 */
@ApiTags('escrow')
@Controller('v1/escrow')
export class EscrowController {

    constructor(private readonly escrowService: EscrowService) {}

    /**
     * Generic endpoint to identify and authenticate an entity with the given plugin type
     * It will ensure that an agent is ready and return the connection data
     */
    @ApiHeader({ name: 'authorization', required: false})
    @Post('verify')
    async verify(
        @Body(new ProtocolValidationPipe()) body: VerifyDto,
        @Headers('authorization') authHeader: string,
    ) {
        const params = {
            ...body.params,
            authorization: authHeader
        };
        return await this.escrowService.verify(body.pluginType, body.filters, params);
    }

    /**
     * TODO rename to enroll
     * Generic endpoint to save escrow data for the given plugin type
     */
    @Post('create')
    async create(@Body(new ProtocolValidationPipe()) body: CreateDto) {
        return await this.escrowService.create(body.pluginType, body.filters, body.params);
    }

    /**
     * Generic endpoint to add a new authentication method, provided there is already a auth db record
     */
    @Post('add')
    async update(@Body(new ProtocolValidationPipe()) body: AddDto) {
        return await this.escrowService.add(body.pluginType, body.id, body.filters, body.params);
    }
}
