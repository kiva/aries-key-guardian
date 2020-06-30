# aries-key-guardian

Interoperable key guardian and recovery system for self sovereign identity wallets


### Setup
Copy .env file (TODO need to figure out an automated way to do this)
Copy .npmrc (TODO once npm is public we won't need this anymore)
Start up the agency-network from aires-guardianship-agency repo
```
npm install
docker-compose up
```

To run tests, you need to execute from inside the docker container (not you Mac)
```
docker exec -it aries-key-guardian npm run test
```

### Epic
There is still a lot of work to do in this repo as described in the epic PRO-1892