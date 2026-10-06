-- Link promotions to existing restaurant menu items.
CREATE TABLE "PromotionMenuItem" (
    "promotionId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "PromotionMenuItem_pkey" PRIMARY KEY ("promotionId", "menuItemId")
);

CREATE INDEX "PromotionMenuItem_menuItemId_idx" ON "PromotionMenuItem"("menuItemId");

ALTER TABLE "PromotionMenuItem"
ADD CONSTRAINT "PromotionMenuItem_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromotionMenuItem"
ADD CONSTRAINT "PromotionMenuItem_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
