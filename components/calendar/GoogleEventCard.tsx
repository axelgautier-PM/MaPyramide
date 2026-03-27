"use client";

import type { GoogleCalendarEventOverlay } from "@/types/calendar";
import { formatDuration } from "@/types/calendar";
import { colors, font } from "@/lib/tokens";

const GOOGLE_BLUE = "#4285F4";

interface GoogleEventCardProps {
  event: GoogleCalendarEventOverlay;
}

/**
 * Carte d'un événement Google Calendar (lecture seule).
 * Bordure gauche bleue Google + badge "G" — non éditable.
 */
export function GoogleEventCard({ event }: GoogleEventCardProps) {
  return (
    <div
      className="flex items-stretch rounded-xl overflow-hidden"
      style={{
        background: colors.surface,
        border: `1.5px solid ${colors.border}`,
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        opacity: 0.9,
      }}
      title="Événement Google Calendar — lecture seule"
    >
      {/* Accent gauche Google blue */}
      <div
        className="w-1 shrink-0 rounded-l-xl"
        style={{ background: GOOGLE_BLUE }}
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
          </p>
        </div>

        {/* Badge G */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: GOOGLE_BLUE }}
        >
          <span
            style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: font.dm }}
          >
            G
          </span>
        </div>
      </div>
    </div>
  );
}
