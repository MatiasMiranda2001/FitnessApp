-- Agrega columnas de Mercado Pago a la tabla profiles
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT;

-- Índice opcional para buscar por preapproval_id desde el webhook
CREATE INDEX IF NOT EXISTS idx_profiles_mp_preapproval_id
  ON profiles (mp_preapproval_id)
  WHERE mp_preapproval_id IS NOT NULL;
