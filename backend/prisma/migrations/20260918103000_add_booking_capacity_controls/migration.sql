ALTER TABLE "Reservation" ADD COLUMN "holdExpiresAt" TIMESTAMP(3);

-- Legacy unpaid holds had no expiry. Release them before active-booking constraints are added.
UPDATE "Reservation"
SET status = 'CANCELLED'::"ReservationStatus",
    "cancelledAt" = NOW(),
    "cancelledBy" = 'SYSTEM',
    "cancellationReason" = 'SYSTEM_EXPIRED_LEGACY_HOLD'
WHERE status = 'PENDING'::"ReservationStatus";

-- Keep the strongest/latest row when legacy data contains duplicate active bookings.
WITH ranked AS (
  SELECT r.id,
         ROW_NUMBER() OVER (
           PARTITION BY r."userId", r."restaurantId", r.date, r.time
           ORDER BY CASE WHEN p.status = 'SUCCEEDED'::"PaymentStatus" THEN 0 ELSE 1 END,
                    r."createdAt" DESC
         ) AS row_number
  FROM "Reservation" r
  LEFT JOIN "Payment" p ON p."reservationId" = r.id
  WHERE r.status IN (
    'PENDING'::"ReservationStatus",
    'CONFIRMED'::"ReservationStatus",
    'MODIFIED'::"ReservationStatus",
    'CHECKED_IN'::"ReservationStatus"
  )
)
UPDATE "Reservation" r
SET status = 'CANCELLED'::"ReservationStatus",
    "cancelledAt" = NOW(),
    "cancelledBy" = 'SYSTEM',
    "cancellationReason" = 'SYSTEM_DUPLICATE_CLEANUP'
FROM ranked
WHERE r.id = ranked.id AND ranked.row_number > 1;

CREATE UNIQUE INDEX "Reservation_active_customer_slot_key"
ON "Reservation" ("userId", "restaurantId", date, time)
WHERE status IN (
  'PENDING'::"ReservationStatus",
  'CONFIRMED'::"ReservationStatus",
  'MODIFIED'::"ReservationStatus",
  'CHECKED_IN'::"ReservationStatus"
);

CREATE TABLE "RestaurantTable" (
  id TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY (id),
  CONSTRAINT "RestaurantTable_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RestaurantTable_restaurantId_name_key" ON "RestaurantTable"("restaurantId", name);
CREATE INDEX "RestaurantTable_restaurantId_isActive_idx" ON "RestaurantTable"("restaurantId", "isActive");

CREATE TABLE "RestaurantSlotOverride" (
  id TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  date TIMESTAMP(3) NOT NULL,
  time TEXT NOT NULL,
  capacity INTEGER,
  "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RestaurantSlotOverride_pkey" PRIMARY KEY (id),
  CONSTRAINT "RestaurantSlotOverride_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RestaurantSlotOverride_restaurantId_date_time_key"
ON "RestaurantSlotOverride"("restaurantId", date, time);
CREATE INDEX "RestaurantSlotOverride_restaurantId_date_idx"
ON "RestaurantSlotOverride"("restaurantId", date);
