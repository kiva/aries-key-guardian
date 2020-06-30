import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for new wallet credentials
 */
export class WalletCredentialsDto {

  /** The user's financial DID */
  @ApiProperty()
  @IsString() readonly did: string;

  /** The id of the wallet */
  @ApiProperty()
  @IsString() readonly walletId: string;

  /** The key of the wallet */
  @ApiProperty()
  @IsString() readonly walletKey: string;

  /** The seed to recreate their DID if necessary */
  @ApiProperty()
  @IsString() readonly seed: string;
}
