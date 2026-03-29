"use client";

import { useState, useEffect, useCallback } from "react";

// Clé publique VAPID — exposée côté client (pas sensible)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// Convertit la clé VAPID base64 en Uint8Array pour l'API PushManager
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const uint8 = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    uint8[i] = rawData.charCodeAt(i);
  }
  return uint8.buffer as ArrayBuffer;
}

// Vérifie si le navigateur supporte Web Push
// iOS : requis d'être en mode standalone (PWA installée depuis Safari)
function checkSupport(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export interface UsePushNotificationsReturn {
  isSupported:  boolean;
  isSubscribed: boolean;
  permission:   NotificationPermission | "unknown";
  loading:      boolean;
  subscribe:    () => Promise<void>;
  unsubscribe:  () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported,  setIsSupported]  = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission,   setPermission]   = useState<NotificationPermission | "unknown">("unknown");
  const [loading,      setLoading]      = useState(true);

  // Vérifier l'état d'abonnement au montage
  useEffect(() => {
    async function checkSubscription() {
      const supported = checkSupport();
      setIsSupported(supported);

      if (!supported) {
        setLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        setIsSubscribed(false);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, []);

  // Activer les notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return;
    setLoading(true);

    try {
      // 1. Demander la permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // 2. Créer la subscription PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 3. Extraire les clés
      const subJson   = subscription.toJSON();
      const endpoint  = subscription.endpoint;
      const p256dh    = subJson.keys?.p256dh;
      const auth      = subJson.keys?.auth;

      if (!endpoint || !p256dh || !auth) throw new Error("Clés subscription manquantes");

      // 4. Persister en base via l'API
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, p256dh, auth }),
      });

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");

      setIsSubscribed(true);
    } catch (err) {
      console.error("[usePushNotifications] subscribe:", err);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  // Désactiver les notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Supprimer en base
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("[usePushNotifications] unsubscribe:", err);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe };
}
