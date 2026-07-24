DELETE FROM "SiteWidget" WHERE "type" = 'PROFILE';

ALTER TYPE "WidgetType" RENAME TO "WidgetType_old";

CREATE TYPE "WidgetType" AS ENUM (
  'MUSIC_PLAYER',
  'HITOKOTO',
  'FRIEND_LINKS',
  'DATE_CARD',
  'PHOTO_GALLERY',
  'PROJECT_TREE',
  'KEYBOARD'
);

ALTER TABLE "SiteWidget"
  ALTER COLUMN "type" TYPE "WidgetType"
  USING ("type"::text::"WidgetType");

DROP TYPE "WidgetType_old";
