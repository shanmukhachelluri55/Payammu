
ALTER TABLE "Items"
ALTER COLUMN price TYPE FLOAT USING price::FLOAT;



ALTER TABLE "Items"
RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE "Items"
RENAME COLUMN "updatedAt" TO updated_at;


ALTER TABLE "Items"
ADD COLUMN "subVariant" VARCHAR(100);


ALTER TABLE "Items"
ALTER COLUMN "stockPosition" SET DEFAULT 0;


ALTER TABLE "Items"
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC';


CREATE UNIQUE INDEX unique_item_variant
ON "Items" (name, category, "subVariant", "userId")
WHERE "subVariant" IS NOT NULL;

ALTER TABLE items ADD COLUMN subVariant VARCHAR(255) NULL;