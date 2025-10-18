-- Add sort_order column to grows table
ALTER TABLE grows
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Set initial sort order based on creation date (oldest first)
UPDATE grows
SET sort_order = subquery.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS row_num
    FROM grows
) AS subquery
WHERE grows.id = subquery.id;

-- Add sort_order column to plants table
ALTER TABLE plants
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Set initial sort order based on creation date (oldest first), partitioned by grow_id
UPDATE plants
SET sort_order = subquery.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY grow_id ORDER BY created_at) - 1 AS row_num
    FROM plants
) AS subquery
WHERE plants.id = subquery.id;

-- Add index for better query performance
CREATE INDEX idx_grows_user_sort_order ON grows(user_id, sort_order);
CREATE INDEX idx_plants_grow_sort_order ON plants(grow_id, sort_order);