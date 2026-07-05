CREATE TYPE "WidgetArea" AS ENUM ('LEFT', 'RIGHT');
CREATE TYPE "WidgetType" AS ENUM (
  'MUSIC_PLAYER',
  'HITOKOTO',
  'FRIEND_LINKS',
  'PROFILE',
  'DATE_CARD',
  'PHOTO_GALLERY'
);

CREATE TABLE "SiteWidget" (
  "id" TEXT NOT NULL,
  "area" "WidgetArea" NOT NULL,
  "type" "WidgetType" NOT NULL,
  "title" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SiteWidget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteWidget_enabled_area_sortOrder_idx" ON "SiteWidget"("enabled", "area", "sortOrder");
