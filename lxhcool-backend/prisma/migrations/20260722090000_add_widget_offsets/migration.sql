ALTER TABLE "SiteWidget"
ADD COLUMN "horizontalOffset" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN "verticalOffset" DOUBLE PRECISION NOT NULL DEFAULT 20;

UPDATE "SiteWidget"
SET
  "horizontalOffset" = CASE WHEN "area" = 'LEFT' THEN 24 ELSE 20 END,
  "verticalOffset" = CASE
    WHEN "verticalPosition" = 'TOP' AND "type" = 'PROJECT_TREE' THEN 22
    WHEN "verticalPosition" = 'TOP' AND "type" = 'HITOKOTO' THEN 340
    WHEN "verticalPosition" = 'TOP' AND "type" = 'DATE_CARD' THEN 500
    WHEN "verticalPosition" = 'TOP' AND "area" = 'RIGHT' THEN 82
    WHEN "verticalPosition" = 'TOP' THEN 22
    WHEN "verticalPosition" = 'BOTTOM' AND "type" = 'KEYBOARD' THEN 16
    WHEN "verticalPosition" = 'BOTTOM' AND "type" = 'PHOTO_GALLERY' THEN 28
    WHEN "verticalPosition" = 'BOTTOM' AND "type" = 'MUSIC_PLAYER' THEN 300
    WHEN "verticalPosition" = 'BOTTOM' AND "area" = 'LEFT' THEN 16
    ELSE 28
  END;
