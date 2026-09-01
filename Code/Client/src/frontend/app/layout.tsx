import type { Metadata } from "next";
import "./globals.css";
import AuthSync from "./components/AuthSync";

export const metadata: Metadata = {
  title: "Platform to support digital transformation for household businesses",
  description: "Platform to support digital transformation for household businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
