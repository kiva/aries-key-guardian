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

#### Just-in-Time Wallets

"Just-in-Time Wallets" refers to the ability to create a wallet for a given ID if one is missing. While you can always
do this by hitting the /v1/escrow/create route, you might also want this to happen automatically if you instead hit the
/v1/escrow/verify route and discover that you don't have a wallet to verify access to.

To enable Just-in-Time Wallets, you need to set 2 environment variables:
1. `JIT_WALLETS_ENABLED` should be set to `true`. This enabled the Just-in-Time wallet flow.
2. `INTEGRATION_CONTROLLER` should be set to the address of the Controller which is responsible for coordinating access
   to the guardianship system. This controller is expected to have a `/v1/api/onboard` route which accepts a base ID and
   returns the ID of the agent that was created. This route should be responsible for coordinating the onboarding of new
   users of the system. Typically, this means creating a new wallet, configuring an access mechanism, and issuing a 
   credential to that new wallet. As an example, it might be set to `"kiva-controller:8081"`.

You can set these environment variables locally in your generated .env file, using kubernetes secrets, or in whichever
manner works best for your deployment.

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

For more details about TypeORM migrations, take a look at [their documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md).

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

#### Developing Migrations

The process or writing and testing migrations can be a little tedious if you have to create a new docker image every
time you make a minor change to the migration file. To that end, it's recommended to spin up `docker-compose.yml`,
add an entry for escrow-db to your `etc/hosts`, and run the service locally. Every time you run the service locally, it
will attempt to apply your migration.

The Process:
1. Edit `etc/hosts` to contain the following lines:
   ```
   127.0.0.1       escrow-db
   ::1             escrow-db
   ```
2. Comment everything above `# ----------LOCAL MODE----------` and uncomment everything below that same line in `docker-compose.yml`
3. Spin up the local docker-compose: `docker-compose -f docker-compose.yml up --force-recreate`
4. Author/Edit your migration.
5. Build your migration: `npm run build`
6. Test out your migration: `npm run start:debug`

If you see any errors or the migration doesn't do what you expect, go back to step 4. Rinse, repeat.
