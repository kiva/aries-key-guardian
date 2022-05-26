import { FingerprintTypeEnum } from '../fingerprint.type.enum.js';
import { IsEnum, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { FingerprintPositionEnum } from '../fingerprint.position.enum.js';

/**
 * DTO for the params of each fingerprint in the body of the request sent to Bio Auth Service's /save endpoint
 */
export class BioAuthSaveParamsDto {
    @IsInt() readonly type_id: number;
    @IsISO8601() readonly capture_date: string;
    @IsEnum(FingerprintPositionEnum) readonly position: FingerprintPositionEnum;
    @IsOptional() @IsString() readonly image?: string;
    @IsOptional() @IsString() readonly template?: string;
    @IsOptional() @IsNumber() readonly quality_score?: number;
    @IsOptional() @Length(2, 2) readonly missing_code?: string;
    @IsEnum(FingerprintTypeEnum) readonly type: FingerprintTypeEnum;
}
