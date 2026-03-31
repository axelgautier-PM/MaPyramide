import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppInitializer } from "@/components/layout/AppInitializer";
import { ToastContainer } from "@/components/ui/ToastContainer";

// Layout partagé par toutes les pages /app
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppInitializer>
      <div className="min-h-screen flex flex-col bg-off">
        <ToastContainer />
        <Header />
        {/* Contenu centré — shell 720px — padding bas pour la bottom nav */}
        {/* Espaceur compensant le header fixed (44px + safe-area-inset-top) */}
        <div className="safe-top shrink-0" style={{ height: 44 }} aria-hidden />
        <main className="flex-1 app-shell px-4 pb-[80px] pt-3">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppInitializer>
  );
}
