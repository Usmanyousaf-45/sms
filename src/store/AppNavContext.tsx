"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ModuleKey } from "@/types";

interface AppNavContextValue {
  activeModule: ModuleKey;
  setActiveModule: (m: ModuleKey) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const AppNavContext = createContext<AppNavContextValue | null>(null);

export function AppNavProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModuleState] = useState<ModuleKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const setActiveModule = useCallback((m: ModuleKey) => {
    setActiveModuleState(m);
    setMobileNavOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((s) => !s), []);

  const value = useMemo(
    () => ({ activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen }),
    [activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, mobileNavOpen]
  );

  return <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>;
}

export function useAppNav(): AppNavContextValue {
  const ctx = useContext(AppNavContext);
  if (!ctx) throw new Error("useAppNav must be used within AppNavProvider");
  return ctx;
}