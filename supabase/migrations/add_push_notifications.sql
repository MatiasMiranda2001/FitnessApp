-- ============================================================
-- Push Notifications: suscripciones y preferencias
-- ============================================================

-- Tabla para guardar las suscripciones Web Push de cada dispositivo
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para que el service role pueda leer todas las suscripciones (para enviar notificaciones desde cron)
CREATE POLICY "Service role reads all subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================
-- Preferencias de notificaciones en la tabla profiles
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{
    "enabled": false,
    "meals": {
      "breakfast": { "enabled": false, "time": "08:00" },
      "lunch":     { "enabled": false, "time": "13:00" },
      "snack":     { "enabled": false, "time": "17:00" },
      "dinner":    { "enabled": false, "time": "21:00" }
    },
    "workout": { "enabled": false, "time": "19:00" }
  }'::jsonb;
