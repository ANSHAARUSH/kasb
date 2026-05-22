# Database Migration Instructions

## To Enable the "Deal Closed" Feature

The connection functionality is currently working with the Deal Closed feature disabled. To fully enable it, you need to run the database migration:

### Steps:

1. **Open Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" section

2. **Run the Migration:**
   - Copy the contents of `add_deal_closed_column.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **After Migration, Update Code:**
   - Once the columns are added, update `src/lib/supabase.ts` line 70 to:
   ```typescript
   .select('id, status, sender_id, receiver_id, deal_closed')
   ```
   - And line 79 to:
   ```typescript
   dealClosed: data.deal_closed
   ```

### Migration SQL:
```sql
-- Add deal_closed columns to connections table
ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS deal_closed boolean DEFAULT false;

ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS deal_closed_at timestamp with time zone;
```

### Note:
The app will work fine without this migration - the Deal Closed prompt just won't appear on cards until the migration is run.
