/**
 * Can't enable these rules without changing the behavior of the script.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateExternalId1610662630571 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Data migration that populates the external_id table with data from the sms_otp table
        await queryRunner.query(
            `INSERT INTO external_id (did, external_id, external_id_type)
                SELECT agent_id, gov_id_1_hash, 'sl_national_id'
                  FROM sms_otp
                  UNION ALL
                  SELECT agent_id, gov_id_2_hash, 'sl_voter_id'
                  FROM sms_otp;`
        );
    }

    public async down(): Promise<void> {
        // There's nothing really to rollback. If the query fails, nothing will have been done. If it succeeds, there's no way to know what was copied
        // over and what was already there.
    }

}
