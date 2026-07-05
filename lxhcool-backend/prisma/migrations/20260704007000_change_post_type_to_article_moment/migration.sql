CREATE TYPE "PostType_new" AS ENUM ('ARTICLE', 'MOMENT');

ALTER TABLE "Post" ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "Post"
ALTER COLUMN "type" TYPE "PostType_new"
USING (
  CASE
    WHEN "type"::text IN ('MUSIC', 'VIDEO') THEN 'MOMENT'
    ELSE "type"::text
  END
)::"PostType_new";

ALTER TABLE "Post" ALTER COLUMN "type" SET DEFAULT 'ARTICLE';

DROP TYPE "PostType";
ALTER TYPE "PostType_new" RENAME TO "PostType";
