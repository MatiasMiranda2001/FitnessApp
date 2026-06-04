# FitTrack Pro — Setup

Guía paso a paso para arrancar el proyecto con Supabase + Stripe.

## 1. Instalar dependencias nuevas

```bash
npm install
```

Esto baja `@supabase/ssr`, `@supabase/supabase-js`, `stripe` y `@stripe/stripe-js` (ya añadidas a `package.json`).

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. Mientras no tengas Stripe configurado, **el resto de la app funciona** — solo se romperá `/billing` y los webhooks.

```bash
cp .env.example .env.local
```

## 3. Supabase

### a. Crear el proyecto

1. Crea un proyecto en https://supabase.com (free tier sirve).
2. En **Project Settings → API** copia:
   - `NEXT_PUBLIC_SUPABASE_URL` ← Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← anon / public
   - `SUPABASE_SERVICE_ROLE_KEY` ← service_role (¡secreto! no lo expongas al cliente)

### b. Aplicar el schema

1. Abre **SQL Editor → New query**.
2. Copia y pega todo el contenido de `lib/supabase/schema.sql`.
3. Run.

Esto crea las tablas `profiles`, `workout_logs`, `custom_exercises`, `routines`, `food_entries`, `chat_messages`, las políticas RLS, el trigger de creación automática de perfil y los helpers `increment_scan_count` / `increment_ai_message_count`.

### c. Configurar email auth

1. En **Authentication → Providers**, asegúrate de que **Email** esté habilitado.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (o tu dominio en producción)
   - **Redirect URLs**: añade `http://localhost:3000/auth/callback`
3. (Opcional pero recomendado) En **Authentication → Email Templates**, traduce los emails al español si quieres una experiencia consistente.

> **Nota:** Por defecto Supabase exige confirmación de email. Si quieres login inmediato sin confirmar, en **Authentication → Sign In / Up** desactiva "Confirm email".

## 4. Stripe

### a. Producto y precio

1. https://dashboard.stripe.com/test/products → **+ Add product**
2. Nombre: **FitTrack Pro**
3. Precio: **$4.99 USD** / **mensual** / recurring
4. Copia el `price_id` (empieza por `price_`) → `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

### b. API keys

https://dashboard.stripe.com/test/apikeys
- `STRIPE_SECRET_KEY` ← Secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ← Publishable key

### c. Webhook (para testing local)

```bash
# Instala el CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Te imprimirá un `whsec_...` → cópialo a `STRIPE_WEBHOOK_SECRET` en `.env.local`.

Eventos que el webhook procesa:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### d. Webhook en producción

Cuando despliegues:
1. https://dashboard.stripe.com/webhooks → **+ Add endpoint**
2. URL: `https://TU_DOMINIO/api/stripe/webhook`
3. Selecciona los 4 eventos de arriba.
4. Copia el signing secret y guárdalo en las env vars de producción.

## 5. Gemini

Ya estaba configurado: simplemente asegúrate de que `GEMINI_API_KEY` siga en tu `.env.local`.

## 6. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000 → verás la landing.

## 7. Probar el flujo end-to-end

1. **Landing** (`/`): debe verse el hero, las features y el pricing.
2. **Signup** (`/signup`): registra una cuenta. Si está activada la confirmación de email, te llegará un mail con el link a `/auth/callback`.
3. **Onboarding** (`/app`): completa edad, peso, altura, objetivo. Los datos se guardan en `profiles` (Supabase).
4. **Dashboard, rutina, nutrición, coach**: todo debería funcionar igual que antes pero leyendo/escribiendo en Supabase.
5. **Escaneo nutricional**: prueba el escáner IA. A los 6 escaneos (en plan free) debería bloquearse con un mensaje pidiéndote upgrade a Pro.
6. **Billing** (`/billing`): te muestra el contador de uso. Click en **Mejorar a Pro** → te redirige a Stripe Checkout. Usa la tarjeta de prueba `4242 4242 4242 4242` con cualquier CVC y fecha futura.
7. Después del pago, el webhook actualiza tu plan a `pro` en `profiles`. Recarga `/billing` y deberías ver el badge Pro.

## Estructura de archivos nueva

```
lib/
├── supabase/
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server / service-role client
│   ├── middleware.ts      # Refresh de sesión + redirects
│   ├── provider.tsx       # SupabaseProvider + hidratación
│   └── schema.sql         # SQL para Supabase
├── stripe/
│   └── server.ts          # Cliente Stripe + constantes
├── hooks/
│   └── use-store.ts       # useAppData()
├── limits.ts              # checkScanLimit / consumeScan / etc
├── store.ts               # Caché en memoria + write-through
└── types.ts               # AppData + BillingState

app/
├── page.tsx               # Landing pública
├── login/page.tsx
├── signup/page.tsx
├── auth/callback/route.ts
├── app/page.tsx           # App protegida (antes era app/page.tsx)
├── billing/page.tsx
└── api/
    ├── analyze-food/route.ts   # Ahora con auth + límite
    ├── chat/route.ts            # Ahora con auth + límite
    └── stripe/
        ├── checkout/route.ts
        ├── portal/route.ts
        └── webhook/route.ts

middleware.ts              # Protege /app y /billing
```

## Notas de diseño

- **Caché + write-through**: Para no romper componentes existentes que llamaban `loadData()`/`addFoodEntry()` síncronamente, mantengo una caché en memoria. Al iniciar sesión, `SupabaseProvider` llama a `hydrate(userId)` y baja todo. Los writes son optimistas: actualizan la caché inmediatamente y disparan la query a Supabase en background.
- **Re-render automático**: El nuevo hook `useAppData()` (en `lib/hooks/use-store.ts`) suscribe componentes a cambios en la caché vía `useSyncExternalStore`.
- **Límites server-side**: Los contadores viven en `profiles.scan_count` / `profiles.ai_message_count` con su `_month` correspondiente. Las funciones SQL `increment_scan_count` / `increment_ai_message_count` resetean automáticamente al cambiar de mes.
- **Webhook seguro**: El webhook de Stripe usa el `service_role` key (que bypasea RLS) porque ningún usuario está autenticado al recibir un evento de Stripe. El secret de signing protege contra requests no firmados.
