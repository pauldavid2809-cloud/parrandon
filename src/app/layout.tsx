import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Parrandón Navideño 2026 | Seminario Mayor Santo Tomás de Aquino",
  description: "Web App oficial para la adquisición de entradas digitales, verificación de pagos y control de acceso con QR para el Gran Parrandón Navideño del Seminario Mayor Santo Tomás de Aquino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark bg-background">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
