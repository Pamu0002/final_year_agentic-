ALTER TABLE "Reservation"
ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3);

-- Preserve paid pending bookings created before this workflow was introduced.
UPDATE "Reservation" AS r
SET "confirmationExpiresAt" = NOW() + INTERVAL '30 minutes',
    "holdExpiresAt" = NULL
FROM "Payment" AS p
WHERE p."reservationId" = r.id
  AND r.status = 'PENDING'
  AND p.status = 'SUCCEEDED';
