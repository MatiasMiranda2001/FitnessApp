"use client"

import { useState, useEffect, useCallback } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setSupported(pushSupported)

    // Solo acceder a Notification si está disponible (falla en iOS Safari sin PWA)
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }

    // Verificar si ya hay una suscripción activa
    if (pushSupported) {
      navigator.serviceWorker?.ready.then((reg) =>
        reg.pushManager.getSubscription().then(setSubscription)
      )
    }
  }, [])

  const subscribe = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Registrar service worker
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // 2. Pedir permiso
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") { setLoading(false); return false }

      // 3. Suscribirse a push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)

      // 4. Guardar en el servidor
      const json = sub.toJSON()
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", endpoint: json.endpoint, keys: json.keys }),
      })

      setLoading(false)
      return true
    } catch (err) {
      console.error("Push subscribe error:", err)
      setLoading(false)
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    setLoading(true)
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsubscribe", endpoint: subscription.endpoint }),
    })
    await subscription.unsubscribe()
    setSubscription(null)
    setLoading(false)
  }, [subscription])

  return { supported, permission, subscription, loading, subscribe, unsubscribe }
}
