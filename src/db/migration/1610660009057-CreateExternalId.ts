import typeorm from 'typeorm';

export class CreateExternalId1610660009057 implements typeorm.MigrationInterface {

    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {

        // Creates primary key + index named "external_id_pkey"
        // Creates a unique constraint named "external_id_external_id_external_id_type_key" and btree index on (external_id, external_id_type)
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS external_id (
              id SERIAL PRIMARY KEY,
              did VARCHAR(32) NOT NULL,
              external_id TEXT NOT NULL,
              external_id_type TEXT NOT NULL,
              UNIQUE (external_id, external_id_type)
            );`
        );
        await queryRunner.query('CREATE INDEX idx_external_id_did ON external_id(did);');
        await queryRunner.query('CREATE INDEX idx_external_id_external_id ON external_id(external_id);');
        await queryRunner.query('CREATE INDEX idx_external_id_external_id_type ON external_id(external_id_type);');
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS idx_external_id_external_id_type;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_external_id_external_id;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_external_id_did;');
        await queryRunner.query('DROP TABLE IF EXISTS external_id;');
    }

}
