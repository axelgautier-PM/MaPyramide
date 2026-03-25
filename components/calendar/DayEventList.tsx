"use client";

import type { CalendarEvent } from "@/types/calendar";
import { getTimeGroup } from "@/types/calendar";
import { EventCard } from "./EventCard";
import { colors, font } from "@/lib/tokens";

const GROUP_ORDER = ["Matin", "Après-midi", "Soir"] as const;

interface DayEventListProps {
  date: Date;
  events: CalendarEvent[];
  onTapEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

const MONTHS_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const DAYS_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function DayEventList({ date, events, onTapEvent, onAddEvent }: DayEventListProps) {
  const dayLabel = `${DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;

  // Grouper les événements par Matin / Après-midi / Soir
  const grouped = GROUP_ORDER.reduce<Record<string, CalendarEvent[]>>((acc, g) => {
    acc[g] = events.filter((e) => getTimeGroup(e.start_time) === g);
    return acc;
  }, {});

  const hasEvents = events.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Titre du jour */}
      <h2
        className="text-[16px]"
        style={{ fontFamily: font.dm, fontWeight: 700, color: colors.text1, letterSpacing: "-0.3px" }}
      >
        {dayLabel}
      </h2>

      {!hasEvents && (
        <div
          className="rounded-xl py-8 flex flex-col items-center gap-2"
          style={{ background: colors.bg, border: `1.5px dashed ${colors.border}` }}
        >
          <span className="text-[28px]">📭</span>
          <p className="text-[13px]" style={{ color: colors.text3, fontFamily: font.dm }}>
            Aucun créneau ce jour
          </p>
        </div>
      )}

      {hasEvents && GROUP_ORDER.map((group) => {
        const grpEvents = grouped[group];
        if (grpEvents.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-2">
            <span
              className="text-[11px] uppercase tracking-wider"
              style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text3 }}
            >
              {group}
            </span>
            {grpEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} onTap={onTapEvent} />
            ))}
          </div>
        );
      })}

      {/* CTA ajout */}
      <button
        onClick={onAddEvent}
        className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{
          background: colors.surface,
          border: `2px dashed ${colors.primary}50`,
          color: colors.primary,
          fontFamily: font.dm,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <span>+</span>
        <span>Ajouter un créneau</span>
      </button>
    </div>
  );
}
