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
        <main className="flex-1 app-shell px-4 pb-[80px] pt-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppInitializer>
  );
}
