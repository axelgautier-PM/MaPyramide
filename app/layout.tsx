import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MaPyramide — Construis ta meilleure version, un niveau à la fois.",
  description:
    "Progresse dans 6 domaines de vie avec un défi de 3 minutes par jour.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MaPyramide",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#6C63FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full bg-off font-dm-sans antialiased">
        {children}
      </body>
    </html>
  );
}
