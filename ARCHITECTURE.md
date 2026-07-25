# Architecture

Tripi is a TypeScript modular monolith. Root-level `backend/` and `dashboard/` belong to the main Git repository. Root-level `client/` is an independent Git repository for the Expo customer application. The API owns authorization, tenant isolation, financial calculations, status transitions, and transactional seat inventory. PostgreSQL is the source of truth and Prisma is the database boundary.

Organizer scope is derived from authenticated memberships; dashboard-supplied organizer IDs are never authoritative. Booking creation uses a serializable transaction plus a conditional atomic update. Money uses Prisma Decimal and is serialized as strings. The current local-only setup persists uploads under `backend/uploads`. Public assets use `/uploads`; private payment proofs remain accessible only through authenticated application flows.
