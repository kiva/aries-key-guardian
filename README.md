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


### Epic
There is still a lot of work to do in this repo as described in the epic PRO-1892

### Testing the Producer

Here is a sample curl request you can use to test that the Producer produces an event:

```
curl --location --request POST 'http://localhost:3999/produce' \
--header 'Content-Type: application/json' \
--data-raw '{
   "pluginType": "FINGERPRINT",
   "filters": {
      "externalIds": {
         "company_email": "jeffk@kiva.org"
      }
   },
   "params": {
      "fingerprintTemplate": "p2d2ZXJzaW9uZjMuMTMuMGV3aWR0aBi0ZmhlaWdodBkBXmpwb3NpdGlvbnNYmCgYNBhQGEwYYhhKGF4YdhiQGEAYPRhAGGgYgxhuGGQYXxiIGIwYHRhYGHgYoxQYNhg4GEAYOBhNGFcYVhiQGFgYQhg0GGIYXRhoGFkYXBiBanBvc2l0aW9uc1mYKBhUGDwYlBhAGNgYkBhIGMQYShigGPoYwhg8GM4ZAQoZATQYchhiGJsY9Rj9GKcYoBiMGJgYeBioGH4YWhj8GOAY0xhiGK4YqhkBLBkBHhhnGHEYZ2pkaXJlY3Rpb25zmCj7QBUC4DnyQ277P6mUJZeSnyb7QACW0FNxscX7QAi7qr3l4pz7QAqHtd32QzL7P/3Lye3L2Nr7P/Jd+NnIjqn7P/q6OXxyWd37QBcatn+zUFL7QBSKfR3SCW77QAt24qEIAvj7P/6FAHbuno77QA7EyRz1WQX7P/0NahNpvTT7QAfxDh3GsEj7QBgnH6R6yRH7P/bAIOdJM3j7P/bAIOdJM3j7P/MLbXlqTaj7QBTcZdPa7277QBWg5fexTyP7P/eJvSwWAFT7P/O+9jGZu6P7QBM/jAk+rQP7QBQD8CWVDML7QBOjno762wL7QBIPWm9raKL7QBNx8xpx4Dr7QABGiorOTfb7QAhV3EAtFrb7QBNx8xpx4Dr7QAKNq0tbWdD7P/uD1cE/Jrn7QBDAGG8h3e/7P/84iS8eDIj7QAbNFAeAVzj7P+Cc2E/RGPP7P/xKg5NjEdr7P/uD1cE/Jrn7P/eJvSwWAFRldHlwZXN4KEJCQkJFQkVCQkVFRUVFQkVCQkVCRUVFQkJFQkJFRUJFQkVCQkVFRUU=",
      "position": 1
   }
}'
```
