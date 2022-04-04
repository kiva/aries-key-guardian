/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/require-await */
/**
 * Can't enable these rules without changing the behavior of the script.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExternalId1610660009057 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // Creates primary key + index named "external_id_pkey"
        // Creates a unique constraint named "external_id_external_id_external_id_type_key" and btree index on (external_id, external_id_type)
        queryRunner.query(
            `CREATE TABLE IF NOT EXISTS external_id (
              id SERIAL PRIMARY KEY,
              did VARCHAR(32) NOT NULL,
              external_id TEXT NOT NULL,
              external_id_type TEXT NOT NULL,
              UNIQUE (external_id, external_id_type)
            );`
        );
        queryRunner.query('CREATE INDEX idx_external_id_did ON external_id(did);');
        queryRunner.query('CREATE INDEX idx_external_id_external_id ON external_id(external_id);');
        queryRunner.query('CREATE INDEX idx_external_id_external_id_type ON external_id(external_id_type);');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('DROP INDEX IF EXISTS idx_external_id_external_id_type;');
        queryRunner.query('DROP INDEX IF EXISTS idx_external_id_external_id;');
        queryRunner.query('DROP INDEX IF EXISTS idx_external_id_did;');
        queryRunner.query('DROP TABLE IF EXISTS external_id;');
    }

}
