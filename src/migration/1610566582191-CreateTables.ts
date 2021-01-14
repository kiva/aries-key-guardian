import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1610566582191 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // Creates primary key named "sms_otp_pkey"
        // Creates unique constraint and btree index called "sms_otp_agent_id_key"
        // Creates unique constraint and btree index called "sms_otp_gov_id_1_hash_key"
        // Creates unique constraint and btree index called "sms_otp_gov_id_2_hash_key"
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS sms_otp (
              id SERIAL PRIMARY KEY,
              agent_id varchar(32) NOT NULL UNIQUE,
              gov_id_1_hash varchar(32) NOT NULL UNIQUE,
              gov_id_2_hash varchar(32) NOT NULL UNIQUE,
              phone_number_hash varchar(32),
              otp integer,
              otp_expiration_time timestamp
            );`
        );

        // Creates primary key named "wallet_credentials_pkey"
        // Creates unique constraint and btree index called "wallet_credentials_did_key"
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS wallet_credentials (
              id SERIAL PRIMARY KEY,
              did varchar(32) NOT NULL UNIQUE,
              wallet_id varchar(32) NOT NULL,
              wallet_key varchar(32) NOT NULL,
              seed varchar(32) NOT NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE sms_otp`);
        await queryRunner.query(`DROP TABLE wallet_credentials`);
    }

}
