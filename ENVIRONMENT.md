# Environment

Copy each application `.env.example`; never commit populated secret files. Access and refresh JWT secrets must be independent and high entropy. `DATABASE_URL` is server-only. Browser/mobile variables use their framework public prefixes and therefore must never contain secrets.

For Docker, copy the root `.env.example` to `.env`. `DATABASE_URL`, both JWT secrets, and domain values are required. `DATABASE_URL` must use `global-postgres` as its hostname because Tripi joins the existing external `db-network`. The existing `infra` stack must already provide `db-network`, `proxy-network`, and the Docker volume named `infra_uploads_data`. Only the volume’s `public/` subtree is served by Caddy.
