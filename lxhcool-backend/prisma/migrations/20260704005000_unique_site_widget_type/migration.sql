DELETE FROM "SiteWidget"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "type"
        ORDER BY "updatedAt" DESC, "createdAt" DESC
      ) AS row_number
    FROM "SiteWidget"
  ) duplicated_widgets
  WHERE duplicated_widgets.row_number > 1
);

CREATE UNIQUE INDEX "SiteWidget_type_key" ON "SiteWidget"("type");
