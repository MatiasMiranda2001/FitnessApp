// Cliente de Stripe — solo server-side
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  // En build sin secrets podría no estar — log y seguir.
  console.warn("[stripe] STRIPE_SECRET_KEY no está definido")
}

// Fallback no-vacío para que el constructor no explote en build time.
// En producción siempre se usa el env real.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_build_placeholder_not_real", {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
})

export const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ""
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
