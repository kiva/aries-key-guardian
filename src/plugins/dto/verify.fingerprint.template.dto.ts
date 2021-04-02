import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyFingerprintTemplateDto {

    @ApiProperty({
        description: 'Finger position of the fingerprint template'
    })
    @IsNotEmpty() @IsInt() readonly position: number;

    @ApiProperty({
        description: 'Base 64 representation of the fingerprint template'
    })
    @IsNotEmpty() @IsString() readonly template: string;

    static isInstance(objToCheck: any): objToCheck is VerifyFingerprintTemplateDto {
        const dto: VerifyFingerprintTemplateDto = objToCheck as VerifyFingerprintTemplateDto;
        return dto !== undefined && dto.position !== undefined && dto.template !== undefined;
    }
}
