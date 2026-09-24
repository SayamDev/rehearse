import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { StickerCelebration } from "@/components/sticker-celebration";
import { SettingsEffects } from "@/components/settings-effects";
import { RegisterServiceWorker } from "@/components/pwa";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Rehearse: free interview practice", template: "%s · Rehearse" },
  description:
    "Practice job interview questions for any role. Answer by voice or typing, get one clear fix, then try again and watch your score move. Free, no signup.",
  openGraph: {
    title: "Rehearse: free interview practice",
    description: "Answer, get notes, take it again. Free interview practice for any job.",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Rehearse", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4fb" },
    { media: "(prefers-color-scheme: dark)", color: "#17162a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${atkinson.variable} antialiased`}>
      <body className="min-h-[100dvh]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AppNav />
        <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-10 lg:has-[[data-wide]]:max-w-6xl">
          {children}
        </main>
        <StickerCelebration />
        <SettingsEffects />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
