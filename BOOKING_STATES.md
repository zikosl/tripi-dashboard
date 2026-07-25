# Booking states

Allowed customer-facing progression is `PENDING_PAYMENT → PAYMENT_REVIEW → CONFIRMED → COMPLETED`. Pending or review bookings may be customer-cancelled. Confirmed bookings may be cancelled by either party subject to policy. Expiration is an idempotent compare-and-update operation and releases capacity exactly once. Every status change belongs in `BookingStatusHistory` with actor and reason.
