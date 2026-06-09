import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/toast";
import { CookieConsent } from "@/components/cookie-consent";
import { I18nProvider } from "@/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zuklo - Alquileres de propiedades en Argentina",
    template: "%s | Zuklo",
  },
  description: "Encontrá tu próximo alquiler en Argentina. Buscá, compará y gestioná propiedades desde un solo lugar.",
  keywords: ["alquileres", "propiedades", "departamentos", "casas", "Argentina", "Buenos Aires", "inmobiliario"],
  authors: [{ name: "Zuklo" }],
  creator: "Zuklo",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Zuklo",
    title: "Zuklo - Alquileres de propiedades en Argentina",
    description: "Encontrá tu próximo alquiler en Argentina. Buscá, compará y gestioná propiedades desde un solo lugar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zuklo - Alquileres de propiedades en Argentina",
    description: "Encontrá tu próximo alquiler en Argentina. Buscá, compará y gestioná propiedades desde un solo lugar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#10b981",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
            <CookieConsent />
          </AuthProvider>
          <Analytics />
          <SpeedInsights />
        </I18nProvider>
      </body>
    </html>
  );
}
