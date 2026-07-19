"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthView, Role } from "@/types";
import { ROLE_LABELS } from "@/types";
import { DEMO_CREDENTIALS } from "@/data";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

// =============================================================================
// AUTH SCREEN — orchestrates Login / Signup / Forgot Password / Reset Sent
// =============================================================================

const ROLE_ICONS: Record<Role, IconName> = {
  admin: "shield",
  principal: "award",
  teacher: "briefcase",
  student: "graduationCap",
  parent: "userGroup",
};

export function AuthScreen() {
  const [view, setView] = useState<AuthView>("login");

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-[440px] animate-slide-up">
        <BrandHeader />

        <div className="glass rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/50">
          {view === "login" && <LoginForm onNavigate={setView} />}
          {view === "signup" && <SignupForm onNavigate={setView} />}
          {view === "forgot-password" && <ForgotPasswordForm onNavigate={setView} />}
          {view === "reset-sent" && <ResetSentPanel onNavigate={setView} />}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Brightfield ERP · Demo environment · No real data is stored
        </p>
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="flex flex-col items-center mb-7">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
        <Icon name="graduationCap" size={24} className="text-white" />
      </div>
      <h1 className="text-xl font-semibold text-white tracking-tight">Brightfield ERP</h1>
      <p className="text-sm text-slate-400 mt-1">School management, unified.</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LOGIN
// -----------------------------------------------------------------------------

function LoginForm({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { login, loginAsDemo, isAuthenticating, authError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemoPicker, setShowDemoPicker] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) toast.success("Welcome back!", "You've been signed in successfully.");
  }

  async function handleDemoLogin(role: Role) {
    await loginAsDemo(role);
    toast.success(`Signed in as ${ROLE_LABELS[role]}`, "Exploring the demo environment.");
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
      <p className="text-sm text-slate-400 mb-6">Enter your credentials to access your dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          icon="mail"
          placeholder="you@brightfield.edu.pk"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          autoComplete="current-password"
          required
        />

        {authError && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
            <Icon name="alertCircle" size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{authError}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate("forgot-password")}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isAuthenticating}>
          Sign in
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-3 text-slate-500">or try a demo account</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowDemoPicker((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors text-sm text-slate-300"
      >
        <span className="flex items-center gap-2">
          <Icon name="zap" size={15} className="text-amber-400" />
          Quick demo login
        </span>
        <Icon
          name="chevronDown"
          size={15}
          className={cn("transition-transform duration-200", showDemoPicker && "rotate-180")}
        />
      </button>

      {showDemoPicker && (
        <div className="mt-3 grid grid-cols-1 gap-2 animate-slide-up">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.role}
              type="button"
              onClick={() => handleDemoLogin(cred.role)}
              disabled={isAuthenticating}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/10 hover:border-white/15 transition-all text-left group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-400/20 flex items-center justify-center flex-shrink-0 text-indigo-300 group-hover:scale-105 transition-transform">
                <Icon name={ROLE_ICONS[cred.role]} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{cred.label}</p>
                <p className="text-xs text-slate-500 truncate">{cred.description}</p>
              </div>
              <Icon name="arrowRight" size={14} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-slate-400 mt-6">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onNavigate("signup")}
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SIGNUP
// -----------------------------------------------------------------------------

function SignupForm({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { signup, isAuthenticating, authError, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("teacher");
  const toast = useToast();

  const roleOptions: Role[] = ["admin", "principal", "teacher", "student", "parent"];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await signup({ name, email, password, role });
    if (ok) toast.success("Account created!", `Welcome to Brightfield, ${name.split(" ")[0]}.`);
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-semibold text-white mb-1">Create an account</h2>
      <p className="text-sm text-slate-400 mb-6">Set up access for your role at the school.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          icon="user"
          placeholder="Ayesha Khan"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError();
          }}
          autoComplete="name"
          required
        />
        <Input
          label="Email address"
          type="email"
          icon="mail"
          placeholder="you@brightfield.edu.pk"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          icon="lock"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          autoComplete="new-password"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
          <div className="grid grid-cols-3 gap-2">
            {roleOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-medium",
                  role === r
                    ? "bg-indigo-500/15 border-indigo-400/50 text-indigo-200"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-300"
                )}
              >
                <Icon name={ROLE_ICONS[r]} size={17} />
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {authError && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
            <Icon name="alertCircle" size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{authError}</p>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isAuthenticating}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// FORGOT PASSWORD
// -----------------------------------------------------------------------------

function ForgotPasswordForm({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { requestPasswordReset, isAuthenticating, authError, clearError } = useAuth();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await requestPasswordReset(email);
    if (ok) onNavigate("reset-sent");
  }

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={() => onNavigate("login")}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 mb-5 transition-colors"
      >
        <Icon name="arrowLeft" size={13} />
        Back to sign in
      </button>

      <h2 className="text-lg font-semibold text-white mb-1">Reset your password</h2>
      <p className="text-sm text-slate-400 mb-6">
        Enter your email and we&apos;ll send a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          icon="mail"
          placeholder="you@brightfield.edu.pk"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          autoComplete="email"
          required
        />

        {authError && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
            <Icon name="alertCircle" size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{authError}</p>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isAuthenticating}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}

function ResetSentPanel({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  return (
    <div className="animate-fade-in text-center py-2">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
        <Icon name="checkCircle" size={26} className="text-emerald-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1.5">Check your email</h2>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed px-2">
        If an account exists with that email, we&apos;ve sent a link to reset your password.
      </p>
      <Button variant="secondary" size="lg" className="w-full" onClick={() => onNavigate("login")}>
        Back to sign in
      </Button>
    </div>
  );
}