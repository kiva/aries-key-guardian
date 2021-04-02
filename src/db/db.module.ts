import { Module } from '@nestjs/common';
import { ExternalIdDbGateway } from './external.id.db.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { SmsOtpDbGateway } from './sms.otp.db.gateway';
import { SmsOtp } from './entity/sms.otp';
import { WalletCredentials } from './entity/wallet.credentials';
import { WalletCredentialsDbGateway } from './wallet.credentials.db.gateway';

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
