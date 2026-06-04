// Cliente de Mercado Pago — solo server-side
import { MercadoPagoConfig, PreApproval } from "mercadopago"

if (!process.env.MP_ACCESS_TOKEN) {
  console.warn("[mercadopago] MP_ACCESS_TOKEN no está definido")
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "",
})

// Precios en ARS — configurables vía env vars
export const MP_PRICE_ARS = Number(process.env.MP_PRICE_ARS ?? "7500")            // mensual
export const MP_PRICE_ANNUAL_ARS = Number(process.env.MP_PRICE_ANNUAL_ARS ?? "75000") // anual
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export type MpPlan = "monthly" | "annual"
