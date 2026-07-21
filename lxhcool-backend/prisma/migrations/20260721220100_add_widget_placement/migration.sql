CREATE TYPE "WidgetVerticalPosition" AS ENUM ('TOP', 'BOTTOM');

ALTER TABLE "SiteWidget"
ADD COLUMN "verticalPosition" "WidgetVerticalPosition" NOT NULL DEFAULT 'TOP',
ADD COLUMN "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "SiteWidget"
SET "verticalPosition" = 'BOTTOM'
WHERE "type" IN ('MUSIC_PLAYER', 'PHOTO_GALLERY');

INSERT INTO "SiteWidget" (
  "id", "area", "verticalPosition", "rotation", "type", "title",
  "enabled", "sortOrder", "config", "createdAt", "updatedAt"
)
VALUES
  ('system-project-tree', 'LEFT', 'TOP', -3, 'PROJECT_TREE', '项目目录', true, 0, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-keyboard', 'LEFT', 'BOTTOM', 0, 'KEYBOARD', '键盘', true, 1, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO NOTHING;

DROP INDEX IF EXISTS "SiteWidget_enabled_area_sortOrder_idx";
CREATE INDEX "SiteWidget_enabled_area_verticalPosition_sortOrder_idx"
ON "SiteWidget"("enabled", "area", "verticalPosition", "sortOrder");
