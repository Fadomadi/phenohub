import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import AgeGateOverlay from "@/components/AgeGateOverlay";
import { AGE_COOKIE_NAME, AGE_COOKIE_VALUE } from "@/lib/ageGate";
import "./globals.css";

const THEME_COOKIE_NAME = "phenohub-theme";

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
  const storedTheme = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const initialTheme = storedTheme === "dark" ? "dark" : "light";
  const scriptFallbackTheme = JSON.stringify(initialTheme);

  return (
    <html
      lang="de"
      suppressHydrationWarning
      data-theme={initialTheme}
      className={initialTheme === "dark" ? "dark" : undefined}
      style={{ colorScheme: initialTheme }}
    >
      <body
        suppressHydrationWarning
        className="antialiased"
        style={{
          backgroundColor: initialTheme === "dark" ? "#020617" : "#ffffff",
          color: initialTheme === "dark" ? "#e6f0ff" : "#171717",
        }}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var storageKey='phenohub-theme';var preferenceKey='phenohub-theme-preference';var fallback=${scriptFallbackTheme};var stored=window.localStorage.getItem(storageKey);var storedPref=window.localStorage.getItem(preferenceKey);var hasStoredPref=storedPref==='dark'||storedPref==='light';var theme=hasStoredPref?storedPref:fallback;var root=document.documentElement;var body=document.body;var apply=function(next){if(!root)return;var isDark=next==='dark';root.setAttribute('data-theme',next);root.classList.toggle('dark',isDark);root.style.colorScheme=isDark?'dark':'light';if(body){body.classList.toggle('dark',isDark);body.style.colorScheme=isDark?'dark':'light';body.style.backgroundColor=isDark?'#020617':'#ffffff';body.style.color=isDark?'#e6f0ff':'#171717';}document.cookie=storageKey+'='+next+'; path=/; max-age=31536000; SameSite=Lax';};apply(theme);if(!hasStoredPref){window.localStorage.setItem(storageKey,theme);window.localStorage.setItem(preferenceKey,theme);} }catch(e){}})();`}
        </Script>
        <ThemeProvider initialTheme={initialTheme}>
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
