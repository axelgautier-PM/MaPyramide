"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { colors, font, radii, shadows } from "@/lib/tokens";

// ─── Version de l'application ────────────────────────────────────────────────
const APP_VERSION = "0.1.0";

// ─── Composant ToggleRow ──────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  first?: boolean;
}

function ToggleRow({ label, description, value, onToggle, first = true }: ToggleRowProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderTop: first ? "none" : `1px solid ${colors.border}` }}
    >
      <div className="flex-1 pr-4">
        <p className="text-[14px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}>
          {label}
        </p>
        <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text2 }}>
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="w-12 h-7 rounded-full transition-all relative shrink-0"
        style={{ background: value ? colors.primary : colors.border }}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all"
          style={{ left: value ? "calc(100% - 25px)" : 3 }}
        />
      </button>
    </div>
  );
}

// ─── Composant ActionRow ──────────────────────────────────────────────────────

interface ActionRowProps {
  icon: string;
  label: string;
  description?: string;
  color?: string;
  onClick: () => void;
  first?: boolean;
}

function ActionRow({ icon, label, description, color, onClick, first = true }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 transition-all active:opacity-60 text-left"
      style={{ borderTop: first ? "none" : `1px solid ${colors.border}` }}
    >
      <span className="text-[18px] shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px]"
          style={{
            fontFamily: font.dm,
            fontWeight: 500,
            color: color ?? colors.text1,
          }}
        >
          {label}
        </p>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ fontFamily: font.dm, color: colors.text3 }}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Composant SectionLabel ───────────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color?: string }) {
  return (
    <p
      className="text-[11px] uppercase tracking-widest px-1"
      style={{ fontFamily: font.dm, fontWeight: 600, color: color ?? colors.text3 }}
    >
      {label}
    </p>
  );
}

// ─── Composant GroupCard ──────────────────────────────────────────────────────

function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.surface,
        border: `1.5px solid ${colors.border}`,
        boxShadow: shadows.sm,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modale suppression de compte ────────────────────────────────────────────

interface DeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteModal({ onCancel, onConfirm, loading }: DeleteModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown() {
    setCountdown(3);
  }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const canConfirm = countdown === 0;

  return (
    /* Fond semi-transparent */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      {/* Bottom sheet */}
      <div
        className="w-full max-w-sm mx-auto rounded-t-3xl p-6 flex flex-col gap-4"
        style={{ background: colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée */}
        <div
          className="w-10 h-1 rounded-full mx-auto -mt-1"
          style={{ background: colors.border }}
        />

        {/* Icône + titre */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
            style={{ background: colors.dangerLight }}
          >
            🗑️
          </div>
          <p
            className="text-[20px] text-center"
            style={{ fontFamily: font.dm, fontWeight: 800, color: colors.text1, letterSpacing: "-0.4px" }}
          >
            Supprimer mon compte ?
          </p>
          <p
            className="text-[14px] text-center leading-relaxed"
            style={{ fontFamily: font.dm, color: colors.text2 }}
          >
            Cette action est <strong>irréversible</strong>. Toute ta progression, tes défis et ton streak seront définitivement supprimés.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-2.5 pt-2 pb-2">
          {/* Bouton danger — 2 étapes */}
          {countdown === null ? (
            <button
              onClick={startCountdown}
              className="w-full py-4 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
              style={{
                background: colors.danger,
                color: "#fff",
                fontFamily: font.dm,
                fontWeight: 700,
              }}
            >
              Supprimer définitivement
            </button>
          ) : (
            <button
              onClick={canConfirm ? onConfirm : undefined}
              disabled={!canConfirm || loading}
              className="w-full py-4 rounded-2xl text-[15px] transition-all"
              style={{
                background: canConfirm ? colors.danger : colors.border,
                color: canConfirm ? "#fff" : colors.text3,
                fontFamily: font.dm,
                fontWeight: 700,
                cursor: canConfirm ? "pointer" : "not-allowed",
              }}
            >
              {loading
                ? "Suppression…"
                : canConfirm
                ? "Confirmer la suppression"
                : `Confirmer (${countdown}…)`}
            </button>
          )}

          {/* Annuler */}
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl text-[15px] transition-all active:opacity-70"
            style={{
              background: colors.bg,
              border: `1.5px solid ${colors.border}`,
              color: colors.text2,
              fontFamily: font.dm,
              fontWeight: 500,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { profile, isGoogleConnected, setGoogleConnected } = useAppStore();

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
