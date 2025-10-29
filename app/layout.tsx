import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Gerador e Analisador de Dados",
  description: "Aplicação para geração e análise de dados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
