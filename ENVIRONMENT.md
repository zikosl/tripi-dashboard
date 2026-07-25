# Environment

Copy each application `.env.example`; never commit populated secret files. Access and refresh JWT secrets must be independent and high entropy. `DATABASE_URL` is server-only. Browser/mobile variables use their framework public prefixes and therefore must never contain secrets. The current setup uses local filesystem storage and disables email delivery, leaving PostgreSQL as the only Docker dependency.
