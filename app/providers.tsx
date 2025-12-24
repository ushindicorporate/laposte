// /app/providers.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      {/* Configuration pro pour les toasts : discret, positionné, riche */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        theme="system"
        className="toaster-group"
        toastOptions={{
          style: { zIndex: 9999 } 
        }}
      />
    </NextThemesProvider>
  );
}