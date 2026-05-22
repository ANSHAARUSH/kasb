-- Remove the unique constraint to allow multiple boosts per investor/startup pair
ALTER TABLE investor_boosts DROP CONSTRAINT IF EXISTS investor_boosts_investor_id_startup_id_key;
