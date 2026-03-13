// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent text-slate-900 antialiased">{children}</body>
    </html>
  );
}
