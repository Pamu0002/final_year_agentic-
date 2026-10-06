ALTER TABLE "Reservation"
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledBy" TEXT,
ADD COLUMN "cancellationReason" TEXT;
