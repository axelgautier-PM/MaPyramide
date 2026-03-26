"use client";

import { useToastStore } from "@/lib/hooks/useToast";

const ICONS: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS: Record<string, { bg: string; color: string; border: string }> = {
  success: { bg: "#EEF7E6", color: "#2E7D0E", border: "#AAD8A0" },
  error:   { bg: "#FFF2EE", color: "#B84020", border: "#F5B8A8" },
  info:    { bg: "#EEF4FF", color: "#1A5FA8", border: "#A8C8F5" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none safe-top"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 8px)` }}
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const c = COLORS[toast.type];
        return (
          <button
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl text-[14px] w-full max-w-sm shadow-lg"
            style={{
              background: c.bg,
              color: c.color,
              border: `1px solid ${c.border}`,
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              animation: "slideDown 200ms ease-out",
            }}
          >
            <span className="text-[16px] leading-none">{ICONS[toast.type]}</span>
            {toast.message}
          </button>
        );
      })}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
