# CREATE NX PROJECT 
`npx create-nx-workspace@latest ticketing-v4`

# INSTAL NEST in NX 
`npm install --save-dev @nx/nest`

# GENERATE APP
## Apps
`nx generate @nx/nest:app --name=client-gateway --directory=apps/client-gateway`
`nx generate @nx/nest:app --name=auth --directory=apps/auth`
`nx generate @nx/nest:app --name=tickets --directory=apps/tickets`
`nx generate @nx/nest:app --name=orders --directory=apps/orders`

## libs
`nx generate @nx/node:library --name=common --directory=libs/common`
`nx generate @nx/node:library --name=errors --directory=libs/errors`
`nx generate @nx/node:library --name=contracts --directory=libs/contracts`
`nx generate @nx/node:library --name=transport --directory=libs/transport`
`nx generate @nx/nest:library --name=elasticsearch --directory=libs/elasticsearch --buildable`
After generating an app/lib run: `nx sync`

# CREATE NEST MODULE WITH RESOURCE
`nest g resource users`

# MONGODB
`docker exec -it ticketing-auth-mongo mongosh`
`kubectl exec -it auth-mongo-depl-865ff79878-kxhhj -- mongosh`
`show dbs`
`use auth`
`show collections`
`db.collection.find()`
`db.collection.deleteOne({ email: "test@test.com" })`
`db.collection.deleteMany({})`
`db.collection.countDocuments({})`
`db.tickets.countDocuments({price: 10})`

# REBUILD DOCKER-COMPOSE IMAGE
`docker-compose up --build`
`docker-compose up -d --build auth`

docker compose down -v
docker compose up --build

`docker compose stop client-gateway`
`docker compose rm -fsv client-gateway`
`docker compose up --build client-gateway`

`docker compose stop auth`
`docker compose rm -fsv auth`
`docker compose up --build auth`

`docker compose stop tickets`
`docker compose rm -fsv tickets`
`docker compose up --build tickets`
