"use client";

import { AuthProvider, useAuth } from "@/store/AuthContext";
import { ToastProvider } from "@/store/ToastContext";
import { ThemeProvider } from "@/store/ThemeContext";
import { AppNavProvider } from "@/store/AppNavContext";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AppShell } from "@/components/layout/AppShell";

// =============================================================================
// ROOT PAGE
// Gates between the unauthenticated AuthScreen and the authenticated AppShell
// (Sidebar + Topbar + routed module content, built out phase by phase).
// =============================================================================

export default function Page() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppNavProvider>
            <RootGate />
          </AppNavProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function RootGate() {
  const { session } = useAuth();
  if (!session) return <AuthScreen />;
  return <AppShell />;
}