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
`nx generate @nx/nest:app --name=expiration --directory=apps/expiration`
`nx generate @nx/nest:app --name=payments --directory=apps/payments`

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
`docker exec -it ticketing-v4-tickets-mongo-js mongosh`
`docker exec -it ticketing-v4-orders-mongo-js mongosh`
`docker exec -it ticketing-v4-payments-mongo-js mongosh`
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

`docker compose build --no-cache` // To build with new dependencies

docker compose down -v
docker compose up --build

`docker compose stop client-gateway`
`docker compose rm -fsv client-gateway`
`docker compose up --build client-gateway`

```
docker compose rm -fsv auth tickets orders payments expiration client-gateway
docker compose up -d --build auth tickets orders payments expiration client-gateway
```

`docker compose stop auth`
`docker compose rm -fsv auth`
`docker compose up --build auth`

`docker compose stop tickets`
`docker compose rm -fsv tickets`
`docker compose up --build tickets`

# RESTART NATS
````
docker compose rm -sf nats
docker compose up -d nats
docker compose restart orders expiration tickets
````

# NATS CLI
````
docker compose --profile tools up -d nats-box
docker compose exec nats-box nats --server nats:4222 stream ls
docker compose exec nats-box nats --server nats:4222 stream info ticketing
docker compose exec nats-box sh
````

```
nquery() {
  stream=$1
  filter=$2

  max=$(nats --server nats:4222 stream info "$stream" --json | jq -r '.state.messages')

  for i in $(seq 1 "$max"); do
    nats --server nats:4222 stream get "$stream" "$i" --json
  done | jq -c "
    .data
    | @base64d
    | fromjson
    | select($filter)
  "
}

nquery ticketing '.price == 150'
```

# OBSERVABILITY
````
docker compose up -d --build tempo grafana otel-collector
open http://localhost:3006
# user: admin
# password: admin
````
