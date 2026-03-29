"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { colors, font, shadows } from "@/lib/tokens";
import { ToggleRow, ActionRow, SectionLabel, GroupCard } from "@/components/profil/ProfilUI";
import { DeleteModal } from "@/components/profil/DeleteModal";

// ─── Version de l'application ────────────────────────────────────────────────
const APP_VERSION = "0.1.0";

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { profile, isGoogleConnected, setGoogleConnected } = useAppStore();

  // Push notifications
  const push = usePushNotifications();
  const [testSent,    setTestSent]    = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Debug mode
  const [debugMode, setDebugMode]   = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [debugSaved, setDebugSaved] = useState(false);

  // Google Calendar
  const [googleLoading, setGoogleLoading] = useState(false);

  // Suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);

  // Compteur secret (5 taps sur le footer pour ouvrir dev tools)
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mp_debug_mode") === "true";
    setDebugMode(stored);
    setShowDevTools(stored);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  function toggleDebug() {
    const next = !debugMode;
    localStorage.setItem("mp_debug_mode", String(next));
    setDebugMode(next);
    setDebugSaved(true);
    setTimeout(() => setDebugSaved(false), 2000);
  }

  async function handleTestNotification() {
    setTestLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          title:  "MaPyramide 🔔",
          body:   "Les notifications fonctionnent !",
          url:    "/app",
        }),
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setTestLoading(false);
    }
  }

  async function handleGoogleDisconnect() {
    setGoogleLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("google_oauth_tokens").delete().eq("user_id", user.id);
      }
      setGoogleConnected(false);
    } catch {
      // Silencieux
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      // Supprime les données utilisateur (cascade via ON DELETE CASCADE)
      // Pour supprimer l'entrée auth.users, une Edge Function côté serveur est requise.
      // En attendant : déconnexion + information.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Appel RPC serveur si disponible (à créer en Edge Function)
        const { error } = await supabase.rpc("delete_user_account");
        if (error) throw error;
      }
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch {
      // Fallback : si la fonction RPC n'existe pas encore
      setDeleteLoading(false);
      setShowDeleteModal(false);
      alert("Pour supprimer définitivement ton compte, contacte-nous à support@mapyramide.com.");
    }
  }

  function handleReinitOnboarding() {
    localStorage.removeItem("mp_onboarding_done");
    localStorage.removeItem("mp_cal_welcome_done");
    localStorage.removeItem("mp_redirect_defis");
    alert("Onboarding réinitialisé — recharge la page");
  }

  // Tap secret × 5 sur le footer pour révéler les outils dev
  function handleFooterTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setShowDevTools(true);
    }
  }

  // ── Données ────────────────────────────────────────────────────────────────

  const email   = profile?.email ?? "–";
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Contenu principal ── */}
      <div className="flex flex-col gap-5 pb-6">

        {/* En-tête */}
        <div>
          <h1
            className="text-[22px]"
            style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.4px" }}
          >
            Mon profil
          </h1>
          <p className="text-[14px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
            Paramètres et préférences
          </p>
        </div>

        {/* Carte identité */}
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, boxShadow: shadows.sm }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] shrink-0"
            style={{ background: colors.primary, fontFamily: font.dm, fontWeight: 700 }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] truncate"
              style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
            >
              {email}
            </p>
            {profile?.streak_count ? (
              <p className="text-[13px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
                🔥 {profile.streak_count} jour{profile.streak_count > 1 ? "s" : ""} de streak
              </p>
            ) : (
              <p className="text-[13px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
                Membre MaPyramide
              </p>
            )}
          </div>
        </div>

        {/* ── Section Notifications ── */}
        <div className="flex flex-col gap-2">
          <SectionLabel label="Notifications" />
          <GroupCard>
            {!push.isSupported ? (
              /* Navigateur non supporté ou PWA non installée */
              <div className="flex items-start gap-3 px-5 py-4">
                <span className="text-[18px] shrink-0 mt-0.5">🔔</span>
                <div>
                  <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
                    Notifications push
                  </p>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ fontFamily: font.dm, color: colors.text2 }}>
                    Pour recevoir des notifications, installe l&apos;app sur ton écran d&apos;accueil via Safari → &quot;Sur l&apos;écran d&apos;accueil&quot; (iOS 16.4+).
                  </p>
                </div>
              </div>
            ) : (
              /* Push supporté */
              <>
                <ToggleRow
                  label="Activer les notifications"
                  description={
                    push.permission === "denied"
                      ? "Bloqué — autorise dans Réglages > Safari"
                      : push.isSubscribed
                      ? "Tu recevras un rappel quotidien à 8h"
                      : "Rappel quotidien pour tes défis"
                  }
                  value={push.isSubscribed}
                  onToggle={push.isSubscribed ? push.unsubscribe : push.subscribe}
                />

                {/* Bouton test — visible uniquement si abonné */}
                {push.isSubscribed && (
                  <div
                    className="px-5 py-3"
                    style={{ borderTop: `1px solid ${colors.border}` }}
                  >
                    <button
                      onClick={handleTestNotification}
                      disabled={testLoading}
                      className="text-[13px] transition-all active:opacity-60"
                      style={{
                        fontFamily: font.dm,
                        fontWeight: 500,
                        color: testSent ? colors.success : colors.primary,
                      }}
                    >
                      {testSent ? "✓ Notification envoyée !" : testLoading ? "Envoi…" : "Envoyer une notification test"}
                    </button>
                  </div>
                )}
              </>
            )}
          </GroupCard>
        </div>

        {/* ── Section Google Calendar ── */}
        <div className="flex flex-col gap-2">
          <SectionLabel label="Google Calendar" />
          <GroupCard>
            {isGoogleConnected ? (
              <div>
                {/* Statut connecté */}
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                  <span className="text-[18px] shrink-0">🗓️</span>
                  <div className="flex-1">
                    <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
                      Google Calendar connecté
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.success }}>
                      ✓ Sync bidirectionnelle active
                    </p>
                  </div>
                </div>
                {/* Bouton déconnexion Google */}
                <ActionRow
                  icon="🔌"
                  label={googleLoading ? "Déconnexion…" : "Déconnecter Google Calendar"}
                  description="Supprime la sync — tes créneaux MP restent intacts"
                  color={colors.danger}
                  onClick={handleGoogleDisconnect}
                  first={false}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-[18px] shrink-0">🗓️</span>
                <div className="flex-1">
                  <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
                    Google Calendar
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
                    Non connecté — reconnecte-toi avec Google pour activer la sync
                  </p>
                </div>
              </div>
            )}
          </GroupCard>
        </div>

        {/* ── Section Compte ── */}
        <div className="flex flex-col gap-2">
          <SectionLabel label="Compte" />
          <GroupCard>
            <ActionRow
              icon="🚪"
              label="Se déconnecter"
              color={colors.danger}
              onClick={handleSignOut}
            />
          </GroupCard>
        </div>

        {/* ── Section Zone dangereuse ── */}
        <div className="flex flex-col gap-2 mt-2">
          <SectionLabel label="Zone dangereuse" color={colors.danger} />
          <GroupCard>
            <ActionRow
              icon="🗑️"
              label="Supprimer mon compte"
              description="Supprime définitivement toutes tes données"
              color={colors.danger}
              onClick={() => setShowDeleteModal(true)}
            />
          </GroupCard>
        </div>

        {/* ── Section Outils développeur (cachée par défaut) ── */}
        {showDevTools && (
          <div className="flex flex-col gap-2 mt-2">
            <SectionLabel label="Outils développeur" />
            <GroupCard>
              <ToggleRow
                label="🤖 Mode CLAUDE_DEBUG"
                description={
                  debugMode
                    ? "Activé — zone de commentaire visible sur chaque défi"
                    : "Désactivé — activer pour annoter les défis"
                }
                value={debugMode}
                onToggle={toggleDebug}
              />

              {debugSaved && (
                <div
                  className="px-5 py-2 text-[12px]"
                  style={{
                    background: debugMode ? colors.successLight : colors.dangerLight,
                    color: debugMode ? colors.success : colors.danger,
                    fontFamily: font.dm,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  {debugMode
                    ? "✓ Mode debug activé — ouvre un défi pour commenter"
                    : "✓ Mode debug désactivé"}
                </div>
              )}

              <ActionRow
                icon="🔄"
                label="Réinitialiser l'onboarding"
                description="Pour tester le flow depuis le début"
                onClick={handleReinitOnboarding}
                first={false}
              />
            </GroupCard>
          </div>
        )}

        {/* ── Footer version (tap ×5 = révèle dev tools) ── */}
        <button
          onClick={handleFooterTap}
          className="mt-4 text-center w-full"
          style={{ background: "none", border: "none" }}
        >
          <span
            className="text-[11px]"
            style={{ fontFamily: font.dm, color: colors.text3 }}
          >
            MaPyramide v{APP_VERSION}
          </span>
        </button>

      </div>

      {/* ── Modale suppression de compte ── */}
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}
    </>
  );
}
