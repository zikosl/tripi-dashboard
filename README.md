# Tripi

Tripi is a bilingual Arabic/English marketplace for organized group travel. The source is organized into three independent root applications. Each application owns its package manifest, lockfile, dependencies, TypeScript configuration, formatting configuration, and scripts.

## Local setup

Requirements: Node 22+, pnpm 10+, Docker, and (for native mobile builds) Xcode or Android Studio.

```bash
cp backend/.env.example backend/.env
cp dashboard/.env.example dashboard/.env.local
cd backend && pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev

cd ../dashboard && pnpm install
pnpm dev

cd client
pnpm install
cp .env.example .env
pnpm dev
```

Swagger: `http://localhost:4000/docs`. For a host-run backend, uploaded files are stored under `backend/uploads` and served from `http://localhost:4000/uploads`. Local email delivery is disabled. Start PostgreSQL separately or connect to the existing server infrastructure described below.

For Android Emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1`. On iOS Simulator, localhost normally works. Press `a` or `i` in Expo CLI to open Android or iOS.

## Validation

```bash
cd backend && pnpm typecheck && pnpm lint && pnpm test && pnpm build
cd ../dashboard && pnpm typecheck && pnpm lint && pnpm test && pnpm build
cd ../client && pnpm typecheck && pnpm lint && pnpm test && npx expo-doctor
```

Development accounts created by the seed use password `TripiDev2026!`: `admin@tripi.local` and `organizer@tripi.local`. These credentials are for local development only.

See [architecture](ARCHITECTURE.md), [booking states](BOOKING_STATES.md), [localization](LOCALIZATION.md), and [environment guide](ENVIRONMENT.md).

## Deploy with the existing infrastructure

Tripi does not create another PostgreSQL, pgAdmin, or Caddy container. Its Compose file builds only the backend, dashboard, and client, then joins the existing `db-network` and `proxy-network`. It also mounts the existing `infra_uploads_data` volume.

```bash
cp .env.example .env
docker compose build
docker compose up -d
docker compose ps
```

Set `DATABASE_URL` to the existing `global-postgres` container using the credentials and database configured by the server’s `infra` project. The external infrastructure must be running before Tripi starts.

Merge [CADDY_TRIPI.conf](CADDY_TRIPI.conf) into the server’s existing Caddyfile. Also add these variables to the existing `caddy` service:

```yaml
environment:
  GAMIX_DOMAIN: ${GAMIX_DOMAIN}
  TRIPI_DOMAIN: ${TRIPI_DOMAIN}
  TRIPI_DASHBOARD_DOMAIN: ${TRIPI_DASHBOARD_DOMAIN}
  TRIPI_CLIENT_DOMAIN: ${TRIPI_CLIENT_DOMAIN}
```

Then place `TRIPI_DOMAIN`, `TRIPI_DASHBOARD_DOMAIN`, and `TRIPI_CLIENT_DOMAIN` in the existing infrastructure `.env` and reload Caddy. The Tripi application Compose file also uses `TRIPI_CLIENT_DOMAIN` to allow the web client through backend CORS.

```bash
docker exec global-caddy caddy reload --config /etc/caddy/Caddyfile
```
