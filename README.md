# aries-key-guardian

Interoperable key guardian and recovery system for self sovereign identity wallets


### Setup
1. Copy the contents of dummy.env into a .env file at the top level of the `aries-key-guardian` repo. You can either do
   this manually, or you can run the provided script from the top level of the `aries-key-guardian` repo:
   ```
   ./scripts/useDummyEnv.sh
   ```
2. Start up the agency-network from aries-guardianship-agency repo.
   ```
   npm install
   docker-compose up
   ```

### Testing
To run tests, you can either run them from inside a docker container or locally from your Mac.
1. To run them from a docker-container:
   ```
   docker exec -it aries-key-guardian npm run test
   ```
2. To run them locally from your Mac:
   ```
   npm run test
   ```


### DB Migrations
To create a new database migration, run the following command from the top level of the `aries-key-guardian` repo:
   ```
   npm run typeorm:migration NameOfNewMigration
   ```

This will create a new typescript class in the `src/migration` folder that concatenates the timestamp of when you ran
the migration and the name you provided. For example, `src/migration/1610566582191-CreateTables.ts` contains a class
called `CreateTables1610566582191`.

Note that the timestamp is meaningful and important as the relative timestamps of the migrations determines the order in
which they are run. So please actually use this npm command to generate migrations instead of crafting them by hand.

In this class, there's an empty `up(queryRunner: QueryRunner)` and `down(queryRunner: QueryRunner)` function for you to
complete.
 * `up(queryRunner: QueryRunner)` is the code that will be executed when the migration is run
 * `down(queryRunner: QueryRunner)` is the code that will be executed if we need to rollback the migration

As a matter of style, we strongly prefer migrations to be written in sql. That means using `queryRunner.query(...)`
instead of TypeORM's query runner api. This gives us a lot more control and certainty over what actually runs on the db.

For more details about TypeORM migrations, take a look at [their documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md).


### Epic
There is still a lot of work to do in this repo as described in the epic PRO-1892
