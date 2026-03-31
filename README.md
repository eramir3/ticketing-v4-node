# 🚀 Ticketing V4 - Monorepo Setup (Nx + NestJS)

---

## 🧱 1. Create Nx Workspace

```bash
# Creates a new Nx workspace
npx create-nx-workspace@latest ticketing-v4
```

---

## 📦 2. Install NestJS Plugin for Nx

```bash
# Adds NestJS support to Nx
npm install --save-dev @nx/nest
```

---

## 🏗️ 3. Generate Applications

### 📁 Apps (Microservices)

```bash
# API Gateway
nx generate @nx/nest:app --name=client-gateway --directory=apps/client-gateway

# Auth Service
nx generate @nx/nest:app --name=auth --directory=apps/auth

# Tickets Service
nx generate @nx/nest:app --name=tickets --directory=apps/tickets

# Orders Service
nx generate @nx/nest:app --name=orders --directory=apps/orders

# Expiration Service
nx generate @nx/nest:app --name=expiration --directory=apps/expiration

# Payments Service
nx generate @nx/nest:app --name=payments --directory=apps/payments
```

---

## 📚 4. Generate Shared Libraries

```bash
# Shared utilities
nx generate @nx/node:library --name=common --directory=libs/common

# Error handling
nx generate @nx/node:library --name=errors --directory=libs/errors

# Transport layer (events, messaging)
nx generate @nx/node:library --name=transport --directory=libs/transport
```

```bash
# 🔁 Always run after generating apps/libs
nx sync
```

---

## 🧩 5. Generate NestJS Resources

```bash
# Generates module + controller + service + DTOs
nest g resource users
```

---

## 🍃 6. MongoDB Commands

### 🐳 Using Docker

```bash
docker exec -it ticketing-auth-mongo mongosh
docker exec -it ticketing-v4-tickets-mongo-js mongosh
docker exec -it ticketing-v4-orders-mongo-js mongosh
docker exec -it ticketing-v4-payments-mongo-js mongosh
```

### ☸️ Using Kubernetes

```bash
kubectl exec -it <pod-name> -- mongosh
```

### 📌 Common Mongo Queries

```js
show dbs
use auth
show collections

db.collection.find()
db.collection.deleteOne({ email: "test@test.com" })
db.collection.deleteMany({})
db.collection.countDocuments({})
db.tickets.countDocuments({ price: 10 })
```

---

## 🐳 7. Docker Compose Workflow

### 🔨 Rebuild Everything

```bash
docker compose up --build
docker compose up -d --build auth
```

### 🚫 Build Without Cache (e.g., new dependencies)

```bash
docker compose build --no-cache
```

### 🔄 Full Reset

```bash
docker compose down -v
docker compose up --build
```

---

### ♻️ Rebuild Specific Services

```bash
# Example: client-gateway
docker compose stop client-gateway
docker compose rm -fsv client-gateway
docker compose up --build client-gateway
```

```bash
# Rebuild multiple services
docker compose rm -fsv auth tickets orders payments expiration client-gateway
docker compose up -d --build auth tickets orders payments expiration client-gateway
```

---

## 🔁 8. Restart NATS

```bash
docker compose rm -sf nats
docker compose up -d nats

# Restart dependent services
docker compose restart orders expiration tickets
```

---

## 📡 9. NATS CLI (JetStream)

```bash
# Start CLI container
docker compose --profile tools up -d nats-box

# List streams
docker compose exec nats-box nats --server nats:4222 stream ls

# Inspect stream
docker compose exec nats-box nats --server nats:4222 stream info ticketing

# Open shell
docker compose exec nats-box sh
```

---

### 🔍 Custom Query Function

```bash
# Query messages with filter
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

# Example usage
nquery ticketing '.price == 150'
```

---

## 📊 10. Observability Stack

```bash
docker compose up -d --build --remove-orphans \
  alloy loki tempo blackbox-exporter prometheus grafana
```

### 🌐 URLs

```
Grafana:             http://localhost:3006
Prometheus:          http://localhost:9090
Blackbox Exporter:   http://localhost:9115
Alloy UI:            http://localhost:12345
```

```
# Grafana credentials
user: admin
password: admin
```

---

### ❤️ Health Endpoints

Each service exposes:

```
GET /health   # Liveness
GET /ready    # Readiness
```

Prometheus scrapes them via `blackbox-exporter`.

---

### ⚠️ Loki Log Replay Issue

If Loki is enabled late, logs may be rejected.

👉 Fix:

```bash
docker compose up -d --force-recreate auth tickets orders payments expiration client-gateway
```

---

### 📦 Reinstall Node Modules (Important)

```bash
docker compose up -d --build --force-recreate --renew-anon-volumes \
  auth tickets orders payments expiration client-gateway prometheus
```

---

### 🔎 Log Query Examples

```
{compose_service="auth"} | json | request_id="..."
{ trace:id = "..." }
```

---

## ☸️ 11. Minikube Setup

### ▶️ Start Cluster

```bash
minikube start \
  --driver=hyperkit \
  --cpus=3 \
  --memory=6144 \
  --disk-size=50g

minikube addons enable ingress
```

---

### 🔍 Useful Commands

```bash
minikube addons list
kubectl config current-context
kubectl config get-contexts
kubectl config use-context <context-name>
kubectl apply -f infra/k8s/
```

---

## 🐳 12. Build Docker Images in Minikube

```bash
# Generic
minikube image build -t <image-name> -f apps/auth/Dockerfile.dev .
```

### 📦 Services

```bash
minikube image build -t ticketing-v4-client-gateway-js -f apps/client-gateway/Dockerfile.dev .
minikube image build -t ticketing-v4-auth-js -f apps/auth/Dockerfile.dev .
minikube image build -t ticketing-v4-tickets-js -f apps/tickets/Dockerfile.dev .
minikube image build -t ticketing-v4-orders-js -f apps/orders/Dockerfile.dev .
minikube image build -t ticketing-v4-payments-js -f apps/payments/Dockerfile.dev .
minikube image build -t ticketing-v4-expiration-js -f apps/expiration/Dockerfile.dev .
```

---

## 🧠 Notes

- Prefer rebuilding only affected services to save time.
- Use `--no-cache` when dependencies change.
- Use `--renew-anon-volumes` when node_modules behaves inconsistently.
- Keep NATS and Mongo clean during debugging.

---
