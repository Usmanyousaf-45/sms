"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, Role, Session } from "@/types";
import { DEMO_USERS, findUserByEmail } from "@/data";
import { getPermissionsForRole } from "@/lib/permissions";
import { sleep, isValidEmail, getAvatarGradient, getInitials, generateId } from "@/lib/utils";

// =============================================================================
// AUTH CONTEXT
// Simulates a real session-based auth flow (login / signup / forgot-password /
// logout) entirely in React state. The shape mirrors what a Better Auth
// session object looks like so swapping in real auth later is mechanical:
// replace the bodies of these functions with actual API calls, keep the
// consuming components untouched.
// =============================================================================

interface AuthContextValue {
  session: Session | null;
  isAuthenticating: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (role: Role) => Promise<void>;
  signup: (params: { name: string; email: string; password: string; role: Role }) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildSession(user: AuthUser): Session {
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 8); // 8h session
  return {
    user,
    permissions: getPermissionsForRole(user.role),
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);
    await sleep(650); // simulate network round-trip

    if (!isValidEmail(email)) {
      setAuthError("Enter a valid email address.");
      setIsAuthenticating(false);
      return false;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      setIsAuthenticating(false);
      return false;
    }

    const user = findUserByEmail(email);
    if (!user) {
      setAuthError("No account found with that email. Try a demo account below.");
      setIsAuthenticating(false);
      return false;
    }
    // Demo password is always "demo1234" for seeded accounts — any 6+ char password
    // is accepted for accounts created via signup during this session.
    if (password !== "demo1234" && !user.id.startsWith("user_signup_")) {
      setAuthError("Incorrect password. Demo accounts use: demo1234");
      setIsAuthenticating(false);
      return false;
    }

    setSession(buildSession({ ...user, lastLoginAt: new Date().toISOString() }));
    setIsAuthenticating(false);
    return true;
  }, []);

  const loginAsDemo = useCallback(async (role: Role) => {
    setIsAuthenticating(true);
    setAuthError(null);
    await sleep(500);
    const user = DEMO_USERS[role];
    setSession(buildSession({ ...user, lastLoginAt: new Date().toISOString() }));
    setIsAuthenticating(false);
  }, []);

  const signup = useCallback(
    async (params: { name: string; email: string; password: string; role: Role }): Promise<boolean> => {
      setIsAuthenticating(true);
      setAuthError(null);
      await sleep(700);

      if (params.name.trim().length < 2) {
        setAuthError("Please enter your full name.");
        setIsAuthenticating(false);
        return false;
      }
      if (!isValidEmail(params.email)) {
        setAuthError("Enter a valid email address.");
        setIsAuthenticating(false);
        return false;
      }
      if (params.password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        setIsAuthenticating(false);
        return false;
      }
      if (findUserByEmail(params.email)) {
        setAuthError("An account with that email already exists. Try logging in instead.");
        setIsAuthenticating(false);
        return false;
      }

      const id = generateId("user_signup");
      const newUser: AuthUser = {
        id,
        name: params.name.trim(),
        email: params.email.trim(),
        role: params.role,
        avatarColor: getAvatarGradient(id),
        avatarInitials: getInitials(params.name.trim()),
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSession(buildSession(newUser));
      setIsAuthenticating(false);
      return true;
    },
    []
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);
    await sleep(700);

    if (!isValidEmail(email)) {
      setAuthError("Enter a valid email address.");
      setIsAuthenticating(false);
      return false;
    }
    // Intentionally always "succeeds" from the UI's perspective (standard
    // security practice: don't reveal whether an email exists).
    setIsAuthenticating(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticating,
      authError,
      login,
      loginAsDemo,
      signup,
      requestPasswordReset,
      logout,
      clearError,
    }),
    [session, isAuthenticating, authError, login, loginAsDemo, signup, requestPasswordReset, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}