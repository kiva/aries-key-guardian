import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class VerifyFingerprintImageDto {

    @ApiProperty({
        description: 'Finger position of the fingerprint template'
    })
    @IsNotEmpty() @IsInt() readonly position: number;

    @ApiProperty({
        description: 'Base 64 representation of the fingerprint image'
    })
    @IsNotEmpty() @IsString() readonly image: string;

    static isInstance(objToCheck: any): objToCheck is VerifyFingerprintImageDto {
        const dto: VerifyFingerprintImageDto = objToCheck as VerifyFingerprintImageDto;
        return dto !== undefined && dto.position !== undefined && dto.image !== undefined;
    }
}
