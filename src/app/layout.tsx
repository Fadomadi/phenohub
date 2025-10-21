import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import AgeGateOverlay from "@/components/AgeGateOverlay";
import { AGE_COOKIE_NAME, AGE_COOKIE_VALUE } from "@/lib/ageGate";

export const metadata: Metadata = {
  title: "PhenoHub – Stecklingsberichte & Anbieterbewertungen",
  description:
    "Vergleiche Stecklinge, Anbieter und Erfahrungsberichte – PhenoHub bündelt Bewertungen, Bilder und Fakten an einem Ort.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasAgeConsent = cookieStore.get(AGE_COOKIE_NAME)?.value === AGE_COOKIE_VALUE;

  return (
    <html lang="de" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var storageKey='phenohub-theme';var stored=window.localStorage.getItem(storageKey);var theme=stored==='dark'?'dark':'light';var root=document.documentElement;var body=document.body;root.setAttribute('data-theme',theme);root.classList.remove('dark');if(body) body.classList.remove('dark');if(theme==='dark'){root.classList.add('dark');if(body) body.classList.add('dark');}}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <ThemeToggle />
          <AuthSessionProvider>
            <AgeGateOverlay initialOpen={!hasAgeConsent} />
            {children}
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
