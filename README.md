# Acquisitions API

Express API using Drizzle ORM and Neon Postgres.

## Docker Environments

This project uses two Docker Compose files:

- `docker-compose.dev.yml` runs the app plus Neon Local.
- `docker-compose.prod.yml` runs only the app and connects to Neon Cloud through `DATABASE_URL`.

Neon Local is a proxy container. It creates an ephemeral Neon branch when it starts and deletes that branch when it stops. The app connects to the proxy at `postgres://neon:npg@neon-local:5432/?sslmode=require`.

## Automated Setup

Run the setup script from a bash-compatible shell:

```sh
npm run setup
```

The script creates missing `.env`, `.env.development`, and `.env.production` files from their examples, creates the `logs` directory, installs npm dependencies, runs lint, and validates the Docker Compose files when Docker is available.

## Local Development With Neon Local

Create your local env file:

```sh
cp .env.development.example .env.development
```

Fill in:

```env
NEON_API_KEY=...
NEON_PROJECT_ID=...
PARENT_BRANCH_ID=...
ARCJET_KEY=...
JWT_SECRET=...
```

`PARENT_BRANCH_ID` is optional. If it is omitted, Neon Local branches from your project's default branch.

Start the development stack:

```sh
docker compose --env-file .env.development -f docker-compose.dev.yml up --build
```

The API will be available at the host port from `APP_PORT`:

```txt
http://localhost:3001
```

If that port is already busy, change `APP_PORT` in `.env.development`.
If local Postgres is already using port `5432`, change `NEON_LOCAL_PORT` in `.env.development`.

Inside the Compose network, the app uses:

```env
DATABASE_URL=postgres://neon:npg@neon-local:5432/?sslmode=require
NEON_LOCAL_FETCH_ENDPOINT=http://neon-local:5432/sql
```

`NEON_LOCAL_FETCH_ENDPOINT` is only needed because this app uses the Neon serverless driver. It tells `@neondatabase/serverless` to send HTTP queries to the Neon Local proxy.

Stop the dev stack:

```sh
docker compose -f docker-compose.dev.yml down
```

By default, Neon Local deletes the ephemeral branch when the container stops.

## Production With Neon Cloud

Create your production env file:

```sh
cp .env.production.example .env.production
```

Set your real Neon Cloud URL:

```env
DATABASE_URL=postgres://user:password@your-production-host.neon.tech/dbname?sslmode=require
```

Do not set `NEON_LOCAL_FETCH_ENDPOINT` in production. Production talks directly to Neon Cloud and does not run the Neon Local proxy.

Start the production-style container:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

## Environment Switching

Development:

```env
APP_PORT=3001
NEON_LOCAL_PORT=5432
DATABASE_URL=postgres://neon:npg@neon-local:5432/?sslmode=require
NEON_LOCAL_FETCH_ENDPOINT=http://neon-local:5432/sql
```

Production:

```env
DATABASE_URL=postgres://user:password@your-production-host.neon.tech/dbname?sslmode=require
```

The app reads `DATABASE_URL` from environment variables in both environments. The only Neon Local-specific variable is `NEON_LOCAL_FETCH_ENDPOINT`.
