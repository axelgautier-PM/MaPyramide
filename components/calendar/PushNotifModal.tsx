"use client";

import { colors, font, shadows, radii } from "@/lib/tokens";

interface PushNotifModalProps {
  onActivate: () => void;   // L'utilisateur accepte d'activer les notifications
  onDismiss:  () => void;   // L'utilisateur refuse — on garde quand même la notif calendrier
}

/**
 * Pop-in demandant à l'utilisateur d'activer les notifications push
 * quand il active un rappel sur un événement calendrier sans avoir
 * de subscription push active.
 */
export function PushNotifModal({ onActivate, onDismiss }: PushNotifModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(22,22,42,0.55)" }}
        onClick={onDismiss}
      />

      {/* Modale centrée */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm px-5"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: colors.surface,
            boxShadow:  shadows.lg,
            border:     `1.5px solid ${colors.border}`,
          }}
        >
          {/* Icône + titre */}
          <div
            className="flex flex-col items-center pt-8 pb-5 px-6 text-center"
            style={{ background: colors.primaryLight }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] mb-3"
              style={{ background: colors.primary }}
            >
              🔔
            </div>
            <p
              className="text-[17px]"
              style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1 }}
            >
              Activer les notifications ?
            </p>
          </div>

          {/* Corps */}
          <div className="px-6 pt-4 pb-6 flex flex-col gap-4">
            <p
              className="text-[14px] leading-relaxed text-center"
              style={{ fontFamily: font.dm, color: colors.text2 }}
            >
              Pour recevoir ce rappel, active les{" "}
              <span style={{ fontWeight: 600, color: colors.text1 }}>
                Notifications calendrier
              </span>{" "}
              dans ton profil. Tu peux les gérer à tout moment.
            </p>

            {/* CTA Activer */}
            <button
              onClick={onActivate}
              className="w-full py-4 rounded-2xl text-[15px] transition-all active:scale-[0.98]"
              style={{
                background:  colors.primary,
                color:       "#fff",
                fontFamily:  font.dm,
                fontWeight:  700,
                borderRadius: radii.xl,
              }}
            >
              Activer les notifications →
            </button>

            {/* Refus */}
            <button
              onClick={onDismiss}
              className="w-full py-2 text-[14px] transition-all active:opacity-60"
              style={{ color: colors.text3, fontFamily: font.dm }}
            >
              Pas maintenant
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
