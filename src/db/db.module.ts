import { Module } from '@nestjs/common';
import { ExternalIdDbGateway } from './external.id.db.gateway.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id.js';
import { SmsOtpDbGateway } from './sms.otp.db.gateway.js';
import { SmsOtp } from './entity/sms.otp.js';
import { WalletCredentials } from './entity/wallet.credentials.js';
import { WalletCredentialsDbGateway } from './wallet.credentials.db.gateway.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalId]),
        TypeOrmModule.forFeature([SmsOtp]),
        TypeOrmModule.forFeature([WalletCredentials])
    ],
    providers: [ExternalIdDbGateway, SmsOtpDbGateway, WalletCredentialsDbGateway],
    exports: [ExternalIdDbGateway, SmsOtpDbGateway, WalletCredentialsDbGateway]
})
export class DbModule {}
