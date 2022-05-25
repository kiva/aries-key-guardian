import typeorm from 'typeorm';

export class MigrateTables1610566573713 implements typeorm.MigrationInterface {

    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {

        // Create a function to drop a pre-existing index whose name we do not know
        await queryRunner.query(
            `CREATE OR REPLACE FUNCTION drop_index(_tablename TEXT, _colname TEXT)
              RETURNS INTEGER
            AS $$
            DECLARE
              i RECORD;
            BEGIN
              FOR i IN
                (
                    SELECT indexname FROM pg_indexes
                    WHERE tablename = _tablename
                    AND indexname ILIKE 'idx%'
                    AND indexdef ILIKE CONCAT('%', _colname, '%')
                )
              LOOP
                RAISE INFO 'DROPPING INDEX: %', i.indexname;
                EXECUTE 'DROP INDEX IF EXISTS "' || i.indexname || '"';
              END LOOP;
            RETURN 1;
            END;
            $$ LANGUAGE plpgsql;`
        );

        // Remove unnecessary old indexes from the synchronized version of the database
        await queryRunner.query(
            'SELECT drop_index(\'sms_otp\', \'agent_id\');'
        );
        await queryRunner.query(
            'SELECT drop_index(\'wallet_credentials\', \'did\');'
        );

        // Don't need this function anymore, so delete it
        await queryRunner.query(
            'DROP FUNCTION drop_index;'
        );

        // Create a function to rename a unique or primary key index whose name we do not know
        await queryRunner.query(
            `CREATE OR REPLACE FUNCTION rename_constraint(_tablename TEXT, _colname TEXT, _newname TEXT, _pk BOOLEAN)
              RETURNS INTEGER
            AS $$
            DECLARE
              i RECORD;
            BEGIN
              IF _pk THEN
                  FOR i IN
                    (
                        SELECT indexname FROM pg_indexes
                        WHERE tablename = _tablename
                        AND indexname ILIKE 'pk%'
                        AND indexdef ILIKE CONCAT('%', _colname, '%')
                    )
                  LOOP
                    RAISE INFO 'RENAMING CONSTRAINT % to %', i.indexname, _newname;
                    EXECUTE 'ALTER TABLE IF EXISTS ' || _tablename || ' RENAME CONSTRAINT "' || i.indexname || '" TO "' || _newname || '"';
                  END LOOP;
              ELSE
                  FOR i IN
                    (
                        SELECT indexname FROM pg_indexes
                        WHERE tablename = _tablename
                        AND indexname ILIKE 'uq%'
                        AND indexdef ILIKE CONCAT('%', _colname, '%')
                    )
                  LOOP
                    RAISE INFO 'RENAMING INDEX % to %', i.indexname, _newname;
                    EXECUTE 'ALTER TABLE IF EXISTS ' || _tablename || ' RENAME CONSTRAINT "' || i.indexname || '" TO "' || _newname || '"';
                  END LOOP;
              END IF;
            RETURN 1;
            END;
            $$ LANGUAGE plpgsql;`
        );

        // Give old PKs and Unique Keys a predictable name
        await queryRunner.query(
            'SELECT rename_constraint(\'sms_otp\', \'id\', \'sms_otp_pkey\', true);'
        );
        await queryRunner.query(
            'SELECT rename_constraint(\'sms_otp\', \'agent_id\', \'sms_otp_agent_id_key\', false);'
        );
        await queryRunner.query(
            'SELECT rename_constraint(\'sms_otp\', \'gov_id_1\', \'sms_otp_gov_id_1_hash_key\', false);'
        );
        await queryRunner.query(
            'SELECT rename_constraint(\'sms_otp\', \'gov_id_2\', \'sms_otp_gov_id_2_hash_key\', false);'
        );
        await queryRunner.query(
            'SELECT rename_constraint(\'wallet_credentials\', \'id\', \'wallet_credentials_pkey\', true);'
        );
        await queryRunner.query(
            'SELECT rename_constraint(\'wallet_credentials\', \'did\', \'wallet_credentials_did_key\', false);'
        );

        // Don't need this function anymore, so delete it
        await queryRunner.query(
            'DROP FUNCTION rename_constraint;'
        );
    }

    public async down(): Promise<void> {
    }

}
