"use client";

import type { GoogleCalendarEventOverlay } from "@/types/calendar";
import { formatDuration } from "@/types/calendar";
import { colors, font } from "@/lib/tokens";

interface GoogleEventCardProps {
  event: GoogleCalendarEventOverlay;
}

/**
 * Carte d'un événement Google Calendar (lecture seule).
 * Bordure gauche colorée selon le calendrier source + badge "G".
 */
export function GoogleEventCard({ event }: GoogleEventCardProps) {
  const accentColor = event.calendar_color ?? "#4285F4";

  return (
    <div
      className="flex items-stretch rounded-xl overflow-hidden"
      style={{
        background: colors.surface,
        border:     `1.5px solid ${colors.border}`,
        boxShadow:  "0 1px 6px rgba(0,0,0,0.04)",
        opacity:    0.9,
      }}
      title="Événement Google Calendar — lecture seule"
    >
      {/* Accent gauche couleur calendrier */}
      <div
        className="w-1 shrink-0 rounded-l-xl"
        style={{ background: accentColor }}
      />

      {/* Contenu */}
      <div className="flex-1 flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] truncate"
            style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
          >
            {event.title}
          </p>
          <p
            className="text-[12px] mt-0.5"
            style={{ fontFamily: font.dm, color: colors.text3 }}
          >
            {event.start_time} · {formatDuration(event.duration_minutes)}
            {event.google_calendar_name ? (
              <span style={{ marginLeft: 4, color: accentColor }}>
                · {event.google_calendar_name}
              </span>
            ) : null}
          </p>
        </div>

        {/* Badge G coloré */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: accentColor }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: font.dm }}>
            G
          </span>
        </div>
      </div>
    </div>
  );
}
