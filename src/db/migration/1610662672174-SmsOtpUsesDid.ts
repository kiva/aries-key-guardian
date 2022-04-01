import { MigrationInterface, QueryRunner } from 'typeorm';

export class SmsOtpUsesDid1610662672174 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE sms_otp RENAME agent_id TO did;');
        await queryRunner.query('ALTER TABLE sms_otp RENAME CONSTRAINT sms_otp_agent_id_key TO sms_otp_did_key;');

        // Note, this will drop all data currently in the column
        await queryRunner.query('ALTER TABLE sms_otp DROP COLUMN gov_id_1_hash;');

        // Note, this will drop all data currently in the column
        await queryRunner.query('ALTER TABLE sms_otp DROP COLUMN gov_id_2_hash;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // Add back the column, add back data into the column for each row, then add back the not null constraint
        await queryRunner.query('ALTER TABLE sms_otp ADD COLUMN gov_id_2_hash varchar(32) UNIQUE;');
        await queryRunner.query(
            `UPDATE sms_otp
            SET gov_id_2_hash = ei.external_id
            FROM external_id AS ei
            WHERE sms_otp.did = ei.did
            AND ei.external_id_type = 'sl_national_id';`
        );
        await queryRunner.query('ALTER COLUMN gov_id_2_hash SET NOT NULL;');

        // Add back the column, add back data into the column for each row, then add back the not null constraint
        await queryRunner.query('ALTER TABLE sms_otp ADD COLUMN gov_id_1_hash varchar(32) UNIQUE;');
        await queryRunner.query(
            `UPDATE sms_otp
            SET gov_id_1_hash = ei.external_id
            FROM external_id AS ei
            WHERE sms_otp.did = ei.did
            AND ei.external_id_type = 'sl_voter_id';`
        );
        await queryRunner.query('ALTER COLUMN gov_id_1_hash SET NOT NULL;');

        await queryRunner.query('ALTER TABLE sms_otp RENAME did TO agent_id;');
        await queryRunner.query('ALTER TABLE sms_otp RENAME CONSTRAINT sms_otp_did_key TO sms_otp_agent_id_key;');
    }

}
