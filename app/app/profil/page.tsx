"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { colors, font, shadows } from "@/lib/tokens";
import { ToggleRow, ActionRow, SectionLabel, GroupCard } from "@/components/profil/ProfilUI";
import { DeleteModal } from "@/components/profil/DeleteModal";
import { GoogleDisconnectModal } from "@/components/profil/GoogleDisconnectModal";
import { GoogleCalendarPicker } from "@/components/calendar/GoogleCalendarPicker";
import type { GoogleCalendarItem } from "@/components/calendar/GoogleCalendarPicker";

// ─── Version de l'application ────────────────────────────────────────────────
const APP_VERSION = "0.2.0";

const DAY_LABELS = [
  { label: "L",  value: 1 },
  { label: "M",  value: 2 },
  { label: "Me", value: 3 },
  { label: "J",  value: 4 },
  { label: "V",  value: 5 },
  { label: "S",  value: 6 },
  { label: "D",  value: 7 },
];

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { profile, isGoogleConnected, setGoogleConnected, notifPrefs, setNotifPrefs } = useAppStore();

  // Push notifications
  const push = usePushNotifications();
  const [testSent,    setTestSent]    = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Debug mode
  const [debugMode,    setDebugMode]    = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [debugSaved,   setDebugSaved]   = useState(false);

  // Google Calendar
  const [googleLoading,       setGoogleLoading]       = useState(false);
  const [showCalendarPicker,  setShowCalendarPicker]  = useState(false);

  // Déconnexion Google Calendar
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

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
      // Passe par QStash (délai 5s) pour valider toute la chaîne de notifications
      const res  = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        console.error("[test notif] erreur:", json.error ?? res.status);
        alert(`Erreur notifications : ${json.error ?? "Vérifier les variables d'environnement Vercel"}`);
        return;
      }
      setTestSent(true);
      setTimeout(() => setTestSent(false), 5000);
    } catch (err) {
      console.error("[test notif]", err);
    } finally {
      setTestLoading(false);
    }
  }

  /** Déconnexion Google Calendar — supprime les tokens mais pas les événements MP */
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

  /** Reconnexion Google Calendar — relance le flux OAuth avec le scope Calendar */
  async function handleGoogleConnect() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app/profil`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt:      "consent",
        },
      },
    });
    if (error) console.error("[Profil] Google connect error:", error.message);
  }

  /** Sauvegarde les calendriers sélectionnés dans le GoogleCalendarPicker */
  async function handleSaveCalendars(calendars: GoogleCalendarItem[]) {
    await fetch("/api/google-calendar/calendars", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ calendars }),
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.rpc("delete_user_account");
        if (error) throw error;
      }
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch {
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

  /** Toggle un jour dans la liste notifDailyDays */
  function toggleDailyDay(day: number) {
    const days = notifPrefs.notifDailyDays;
    setNotifPrefs({
      notifDailyDays: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort(),
    });
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
              /* Navigateur non supporté */
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
              <>
                {/* Toggle principal push */}
                <ToggleRow
                  label="Activer les notifications"
                  description={
                    push.permission === "denied"
                      ? "Bloqué — autorise dans Réglages > Safari"
                      : push.isSubscribed
                      ? "Notifications push actives"
                      : "Active pour recevoir des rappels"
                  }
                  value={push.isSubscribed}
                  onToggle={push.isSubscribed ? push.unsubscribe : push.subscribe}
                />

                {/* Sous-options visibles uniquement si abonné */}
                {push.isSubscribed && (
                  <>
                    {/* Notifications Défis */}
                    <ToggleRow
                      label="Notifications Défis"
                      description="Encouragements et suggestions de nouveaux défis"
                      value={notifPrefs.notifDefis}
                      onToggle={() => setNotifPrefs({ notifDefis: !notifPrefs.notifDefis })}
                      first={false}
                    />

                    {/* Notifications Calendrier */}
                    <ToggleRow
                      label="Notifications Calendrier"
                      description="Rappels avant tes créneaux planifiés"
                      value={notifPrefs.notifCalendar}
                      onToggle={() => setNotifPrefs({ notifCalendar: !notifPrefs.notifCalendar })}
                      first={false}
                    />

                    {/* Notification quotidienne */}
                    <ToggleRow
                      label="Notification quotidienne"
                      description={
                        notifPrefs.notifDaily
                          ? `Chaque jour actif à ${notifPrefs.notifDailyTime}`
                          : "Rappel quotidien pour rester en mouvement"
                      }
                      value={notifPrefs.notifDaily}
                      onToggle={() => setNotifPrefs({ notifDaily: !notifPrefs.notifDaily })}
                      first={false}
                    />

                    {/* Configurateur notification quotidienne */}
                    {notifPrefs.notifDaily && (
                      <div
                        className="px-5 pb-4 flex flex-col gap-3"
                        style={{ borderTop: `1px solid ${colors.border}` }}
                      >
                        {/* Heure */}
                        <div className="flex items-center justify-between pt-3">
                          <span
                            className="text-[13px]"
                            style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text2 }}
                          >
                            Heure
                          </span>
                          <input
                            type="time"
                            value={notifPrefs.notifDailyTime}
                            onChange={(e) => setNotifPrefs({ notifDailyTime: e.target.value })}
                            style={{
                              padding:      "6px 10px",
                              borderRadius: 10,
                              fontSize:     14,
                              fontFamily:   font.dm,
                              color:        colors.text1,
                              background:   colors.bg,
                              border:       `1.5px solid ${colors.border}`,
                              outline:      "none",
                            }}
                          />
                        </div>

                        {/* Jours */}
                        <div className="flex flex-col gap-2">
                          <span
                            className="text-[13px]"
                            style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text2 }}
                          >
                            Jours actifs
                          </span>
                          <div className="flex gap-1.5">
                            {DAY_LABELS.map(({ label, value }) => {
                              const active = notifPrefs.notifDailyDays.includes(value);
                              return (
                                <button
                                  key={value}
                                  onClick={() => toggleDailyDay(value)}
                                  className="flex-1 py-2 rounded-xl text-[12px] transition-all"
                                  style={{
                                    background: active ? colors.primary : colors.bg,
                                    border:     `1.5px solid ${active ? colors.primary : colors.border}`,
                                    color:      active ? "#fff" : colors.text2,
                                    fontFamily: font.dm,
                                    fontWeight: active ? 700 : 400,
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                  </>
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

                {/* Gérer les calendriers */}
                <ActionRow
                  icon="📋"
                  label="Gérer les calendriers"
                  description="Choisir quels calendriers afficher et leur couleur"
                  onClick={() => setShowCalendarPicker(true)}
                  first={false}
                />

                {/* Déconnexion — ouvre la modale de confirmation */}
                <ActionRow
                  icon="🔌"
                  label="Déconnecter Google Calendar"
                  description="Supprime la sync — tes créneaux MaPyramide restent intacts"
                  color={colors.danger}
                  onClick={() => setShowDisconnectModal(true)}
                  first={false}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span className="text-[18px] shrink-0">🗓️</span>
                  <div className="flex-1">
                    <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
                      Google Calendar
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
                      Non connecté — synchronise tes créneaux MaPyramide avec Google
                    </p>
                  </div>
                </div>
                {/* Bouton connexion */}
                <ActionRow
                  icon="🔗"
                  label="Connecter Google Calendar"
                  description="Lancer la synchronisation bidirectionnelle"
                  color={colors.primary}
                  onClick={handleGoogleConnect}
                  first={false}
                />
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
                    color:      debugMode ? colors.success : colors.danger,
                    fontFamily: font.dm,
                    borderTop:  `1px solid ${colors.border}`,
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

              {/* Bouton test notification (déplacé depuis la section Notifications) */}
              <div className="px-5 py-3" style={{ borderTop: `1px solid ${colors.border}` }}>
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
                  {testSent ? "✓ Arrivée dans 5s…" : testLoading ? "Planification…" : "🔔 Envoyer une notification test"}
                </button>
              </div>
            </GroupCard>
          </div>
        )}

        {/* ── Footer version (tap ×5 = révèle dev tools) ── */}
        <button
          onClick={handleFooterTap}
          className="mt-4 text-center w-full"
          style={{ background: "none", border: "none" }}
        >
          <span className="text-[11px]" style={{ fontFamily: font.dm, color: colors.text3 }}>
            MaPyramide v{APP_VERSION}
          </span>
        </button>

      </div>

      {/* ── Modale déconnexion Google Calendar ── */}
      {showDisconnectModal && (
        <GoogleDisconnectModal
          onCancel={() => setShowDisconnectModal(false)}
          onConfirm={async () => { await handleGoogleDisconnect(); setShowDisconnectModal(false); }}
          loading={googleLoading}
        />
      )}

      {/* ── Modale suppression de compte ── */}
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}

      {/* ── Bottom sheet sélection calendriers Google ── */}
      {showCalendarPicker && (
        <GoogleCalendarPicker
          onClose={() => setShowCalendarPicker(false)}
          onSave={handleSaveCalendars}
        />
      )}
    </>
  );
}
