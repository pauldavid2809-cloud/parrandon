import type { Metadata, Viewport } from "next";
import { Young_Serif, Red_Hat_Text } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-young-serif",
  display: "swap",
});

const redHat = Red_Hat_Text({
  subsets: ["latin"],
  variable: "--font-red-hat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parrandón Navideño 2026 · Seminario Mayor Santo Tomás de Aquino",
  description:
    "Activa tu entrada del Parrandón Navideño 2026, reporta tu pago por Zelle o Pago Móvil y escoge tu mesa en el Bulevar del Seminario.",
};

export const viewport: Viewport = {
  themeColor: "#b3122e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${youngSerif.variable} ${redHat.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
