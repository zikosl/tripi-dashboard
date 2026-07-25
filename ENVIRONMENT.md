# Environment

Copy each application `.env.example`; never commit populated secret files. Access and refresh JWT secrets must be independent and high entropy. `DATABASE_URL` is server-only. Browser/mobile variables use their framework public prefixes and therefore must never contain secrets.

For Docker, copy the root `.env.example` to `.env`. `POSTGRES_PASSWORD`, both JWT secrets, and domain values are required. The Compose network names are deliberately external so this infrastructure can share the database and reverse proxy with other stacks; create `db-network` and `proxy-network` once before starting it. Uploaded files persist in `uploads_data`, with only the `public/` subtree served by Caddy.
