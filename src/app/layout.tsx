import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import AuthSessionProvider from "@/components/AuthSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhenoHub – Stecklingsberichte & Anbieterbewertungen",
  description:
    "Vergleiche Stecklinge, Anbieter und Erfahrungsberichte – PhenoHub bündelt Bewertungen, Bilder und Fakten an einem Ort.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var storageKey='phenohub-theme';var stored=window.localStorage.getItem(storageKey);var theme=stored==='dark'?'dark':'light';var root=document.documentElement;var body=document.body;root.setAttribute('data-theme',theme);root.classList.remove('dark');if(body) body.classList.remove('dark');if(theme==='dark'){root.classList.add('dark');if(body) body.classList.add('dark');}}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <ThemeToggle />
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
