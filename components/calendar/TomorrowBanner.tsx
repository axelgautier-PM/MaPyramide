"use client";

import { colors, font, shadows } from "@/lib/tokens";

interface TomorrowBannerProps {
  onPrepareTomorrow: () => void;
}

export function TomorrowBanner({ onPrepareTomorrow }: TomorrowBannerProps) {
  return (
    <button
      onClick={onPrepareTomorrow}
      className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #FF8C42 0%, #FF6B6B 100%)",
        boxShadow: "0 4px 16px rgba(255,140,66,0.30)",
      }}
    >
      <span className="text-[22px]">🌅</span>
      <div className="flex-1">
        <p className="text-[14px] text-white" style={{ fontFamily: font.dm, fontWeight: 700 }}>
          Préparer demain
        </p>
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.75)", fontFamily: font.dm }}>
          Planifie tes créneaux pour demain →
        </p>
      </div>
    </button>
  );
}
