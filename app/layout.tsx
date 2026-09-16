import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnero",
  description: "Reserva tu turno online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
