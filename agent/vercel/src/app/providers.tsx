"use client";

import { AppProvider } from "@/context/app-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </AppProvider>
  );
}
