import { MigrationInterface, QueryRunner } from 'typeorm';

export class DidToAgentId1624768934102 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SmsOtp
        queryRunner.query('ALTER TABLE sms_otp RENAME did TO agent_id;');
        queryRunner.query('ALTER TABLE sms_otp RENAME CONSTRAINT sms_otp_did_key TO sms_otp_agent_id_key;');

        // ExternalId
        queryRunner.query('ALTER TABLE external_id RENAME did TO agent_id;');
        queryRunner.query('ALTER INDEX idx_external_id_did RENAME TO idx_external_id_agent_id;');

        // WalletCredentials
        queryRunner.query('ALTER TABLE wallet_credentials RENAME did TO agent_id;');
        queryRunner.query('ALTER TABLE wallet_credentials RENAME CONSTRAINT wallet_credentials_did_key TO wallet_credentials_agent_id_key;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SmsOtp
        queryRunner.query('ALTER TABLE sms_otp RENAME agent_id TO did;');
        queryRunner.query('ALTER TABLE sms_otp RENAME CONSTRAINT sms_otp_agent_id_key TO sms_otp_did_key;');

        // ExternalId
        queryRunner.query('ALTER TABLE external_id RENAME agent_id TO did;');
        queryRunner.query('ALTER INDEX idx_external_id_agent_id RENAME TO idx_external_id_did;');

        // WalletCredentials
        queryRunner.query('ALTER TABLE wallet_credentials RENAME agent_id TO did;');
        queryRunner.query('ALTER TABLE wallet_credentials RENAME CONSTRAINT wallet_credentials_agent_id_key TO wallet_credentials_did_key;');
    }

}
