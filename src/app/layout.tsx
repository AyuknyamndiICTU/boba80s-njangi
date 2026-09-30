import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/components/i18n-provider";
import { getLang } from "@/lib/data";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BOBA 80s Njangi",
  description: "Cameroon Protestant College Bali - BOBA 80S Njangi contribution ledger",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BOBA 80s", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2f0052",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <I18nProvider lang={lang}>{children}</I18nProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
