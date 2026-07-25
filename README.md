# Tripi

Tripi is a bilingual Arabic/English marketplace for organized group travel. The source is organized into three independent root applications. Each application owns its package manifest, lockfile, dependencies, TypeScript configuration, formatting configuration, and scripts.

## Local setup

Requirements: Node 22+, pnpm 10+, Docker, and (for native mobile builds) Xcode or Android Studio.

```bash
docker compose up -d
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

Swagger: `http://localhost:4000/docs`. PostgreSQL is the only Docker service. Uploaded files are stored under `backend/uploads` and public files are served from `http://localhost:4000/uploads`. Local email delivery is disabled.

For Android Emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1`. On iOS Simulator, localhost normally works. Press `a` or `i` in Expo CLI to open Android or iOS.

## Validation

```bash
cd backend && pnpm typecheck && pnpm lint && pnpm test && pnpm build
cd ../dashboard && pnpm typecheck && pnpm lint && pnpm test && pnpm build
cd ../client && pnpm typecheck && pnpm lint && pnpm test && npx expo-doctor
```

Development accounts created by the seed use password `TripiDev2026!`: `admin@tripi.local` and `organizer@tripi.local`. These credentials are for local development only.

See [architecture](ARCHITECTURE.md), [booking states](BOOKING_STATES.md), [localization](LOCALIZATION.md), and [environment guide](ENVIRONMENT.md).
