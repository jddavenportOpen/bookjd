import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"]
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Book a Time with JD | BookJD",
  description: "Schedule a consultation with JD Davenport. Free intro calls, focused consultations, and deep dive strategy sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}>
        <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link 
              href="https://jddavenport.com" 
              className="text-sm text-muted-foreground hover:text-green transition-colors flex items-center gap-1.5"
            >
              ← Back to jddavenport.com
            </Link>
            <span className="text-sm font-medium text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Book<span className="text-green">JD</span>
            </span>
          </div>
        </nav>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
