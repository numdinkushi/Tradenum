"use client";

import type { ReactNode } from "react";

import { ToastViewport } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
