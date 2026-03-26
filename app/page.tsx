"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/tokens";

// Page racine — redirige vers l'onboarding (première visite) ou l'auth
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const done = typeof window !== "undefined"
      && localStorage.getItem("mp_onboarding_done") === "true";
    router.replace(done ? "/auth" : "/onboarding");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Écran de transition invisible pendant la redirection
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: colors.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
