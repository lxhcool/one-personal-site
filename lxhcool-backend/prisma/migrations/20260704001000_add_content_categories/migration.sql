ALTER TABLE "Post" ADD COLUMN "category" TEXT;
ALTER TABLE "FriendLink" ADD COLUMN "category" TEXT;

CREATE INDEX "Post_category_idx" ON "Post"("category");
CREATE INDEX "FriendLink_category_isVisible_idx" ON "FriendLink"("category", "isVisible");
