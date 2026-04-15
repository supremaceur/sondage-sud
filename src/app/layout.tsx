import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
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
  title: "SUD P2ST — Sondages",
  description: "Plateforme de sondages syndicaux SUD P2ST",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <AuthProvider>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
            {children}
          </main>
          <footer className="border-t py-4 text-center text-xs" style={{ borderColor: "var(--sud-border)", color: "var(--sud-muted)" }}>
            <Link href="/mentions-legales" className="hover:underline" style={{ color: "var(--sud-muted)" }}>
              Mentions légales
            </Link>
            <span className="mx-2">·</span>
            <span>© {new Date().getFullYear()} SUD P2ST</span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
