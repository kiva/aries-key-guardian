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

### Epic
There is still a lot of work to do in this repo as described in the epic PRO-1892
