"use client";

import { colors, font } from "@/lib/tokens";

const DAY_LABELS = ["L", "M", "Me", "J", "V", "S", "D"];
const MONTHS = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

interface WeekStripProps {
  weekStart: Date;
  weekDays: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekStrip({ weekStart, weekDays, selectedDate, onSelectDate, onPrevWeek, onNextWeek }: WeekStripProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = weekDays[6];
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const weekLabel = sameMonth
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTHS[weekStart.getMonth()]}`
    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]}`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: colors.surface, border: `1.5px solid ${colors.border}` }}
    >
      {/* Ligne navigation semaine */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          onClick={onPrevWeek}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: colors.bg, color: colors.text2, fontFamily: font.dm }}
          aria-label="Semaine précédente"
        >
          ←
        </button>
        <span className="text-[13px]" style={{ fontFamily: font.dm, fontWeight: 600, color: colors.text2 }}>
          {weekLabel}
        </span>
        <button
          onClick={onNextWeek}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: colors.bg, color: colors.text2, fontFamily: font.dm }}
          aria-label="Semaine suivante"
        >
          →
        </button>
      </div>

      {/* 7 jours */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-1">
        {weekDays.map((day, idx) => {
          const isToday = day.getTime() === today.getTime();
          const isSelected = day.getTime() === selectedDate.getTime();
          const isWeekend = idx >= 5;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className="flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all"
              style={{
                background: isSelected ? colors.primary : "transparent",
              }}
            >
              <span
                className="text-[10px]"
                style={{
                  fontFamily: font.dm,
                  fontWeight: 500,
                  color: isSelected ? "rgba(255,255,255,0.7)" : isWeekend ? colors.text3 : colors.text2,
                }}
              >
                {DAY_LABELS[idx]}
              </span>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[14px]"
                style={{
                  fontFamily: font.dm,
                  fontWeight: isToday || isSelected ? 700 : 400,
                  color: isSelected
                    ? "#fff"
                    : isToday
                    ? colors.primary
                    : isWeekend
                    ? colors.text3
                    : colors.text1,
                  background: isToday && !isSelected ? colors.primaryLight : "transparent",
                }}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
