-- Create a temporary column for the new UUID
ALTER TABLE conversations ADD COLUMN new_id uuid DEFAULT gen_random_uuid();

-- Copy existing relationships if any (adjust table names as needed)
-- CREATE TEMPORARY TABLE temp_relationships AS
-- SELECT * FROM other_table WHERE conversation_id IS NOT NULL;

-- Drop primary key constraint
ALTER TABLE conversations DROP CONSTRAINT conversations_pkey;

-- Drop the old id column
ALTER TABLE conversations DROP COLUMN id;

-- Rename new_id to id
ALTER TABLE conversations RENAME COLUMN new_id TO id;

-- Make id the primary key
ALTER TABLE conversations ADD PRIMARY KEY (id);

-- Update any foreign key relationships if needed
-- UPDATE other_table ot
-- SET conversation_id = t.new_id
-- FROM temp_relationships t
-- WHERE ot.conversation_id = t.conversation_id::text; 