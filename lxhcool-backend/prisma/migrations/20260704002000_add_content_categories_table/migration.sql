CREATE TYPE "CategoryType" AS ENUM ('POST', 'FRIEND_LINK');

CREATE TABLE "ContentCategory" (
  "id" TEXT NOT NULL,
  "type" "CategoryType" NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentCategory_type_name_key" ON "ContentCategory"("type", "name");
CREATE INDEX "ContentCategory_type_sortOrder_idx" ON "ContentCategory"("type", "sortOrder");

INSERT INTO "ContentCategory" ("id", "type", "name", "sortOrder", "updatedAt")
SELECT CONCAT('cat_post_', MD5("category")), 'POST', "category", 0, CURRENT_TIMESTAMP
FROM "Post"
WHERE "category" IS NOT NULL AND BTRIM("category") <> ''
GROUP BY "category";

INSERT INTO "ContentCategory" ("id", "type", "name", "sortOrder", "updatedAt")
SELECT CONCAT('cat_friend_', MD5("category")), 'FRIEND_LINK', "category", 0, CURRENT_TIMESTAMP
FROM "FriendLink"
WHERE "category" IS NOT NULL AND BTRIM("category") <> ''
GROUP BY "category";
