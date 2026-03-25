"use client";

import type { CalendarEvent } from "@/types/calendar";
import { formatDuration } from "@/types/calendar";
import { colors, font, radii, shadows } from "@/lib/tokens";

interface EventCardProps {
  event: CalendarEvent;
  onTap: (event: CalendarEvent) => void;
}

export function EventCard({ event, onTap }: EventCardProps) {
  const accentColor = event.domain_color ?? colors.primary;

  return (
    <button
      onClick={() => onTap(event)}
      className="w-full text-left transition-all active:scale-[0.98]"
      style={{
        borderRadius: radii.lg,
        background: colors.surface,
        border: `1.5px solid ${colors.border}`,
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: shadows.sm,
        padding: "12px 14px",
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Emoji domaine */}
        {event.domain_icon && (
          <span className="text-[18px] leading-none mt-0.5 shrink-0">{event.domain_icon}</span>
        )}

        <div className="flex-1 min-w-0">
          {/* Heure + durée */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[12px]"
              style={{ fontFamily: font.dm, fontWeight: 600, color: accentColor }}
            >
              {event.start_time.slice(0, 5)}
            </span>
            <span className="text-[11px]" style={{ color: colors.text3, fontFamily: font.dm }}>
              · {formatDuration(event.duration_minutes)}
            </span>
            {event.is_recurring && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text3, fontFamily: font.dm }}>
                🔁 récurrent
              </span>
            )}
            {event.has_reminder && (
              <span className="text-[11px]" style={{ color: colors.text3 }}>🔔</span>
            )}
          </div>

          {/* Titre */}
          <p
            className="text-[14px] leading-snug"
            style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text1 }}
          >
            {event.title}
          </p>
        </div>

        <span className="text-[14px] shrink-0 self-center" style={{ color: colors.text3 }}>›</span>
      </div>
    </button>
  );
}
