"use client";

import { useMemo, useState } from "react";
import { NOTIFICATIONS } from "@/data";
import { useAppNav } from "@/store/AppNavContext";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/store/ThemeContext";
import { globalSearch } from "@/lib/search";
import { timeAgo, cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { NAV_GROUPS } from "@/lib/navigation";

// =============================================================================
// TOPBAR
// Sticky header: mobile nav trigger, page title, global search, notification
// bell (with dropdown + mark-all-read), theme toggle, user menu.
// =============================================================================

const NOTIF_ICONS: Record<string, IconName> = {
  success: "checkCircle",
  warning: "alertTriangle",
  error: "alertCircle",
  info: "info",
};
const NOTIF_COLORS: Record<string, string> = {
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-rose-400",
  info: "text-sky-400",
};

export function Topbar() {
  const { activeModule, setActiveModule, setMobileNavOpen } = useAppNav();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifList, setNotifList] = useState(NOTIFICATIONS);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentLabel = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const found = group.items.find((i) => i.key === activeModule);
      if (found) return found.label;
    }
    return "Dashboard";
  }, [activeModule]);

  const searchResults = useMemo(() => globalSearch(searchQuery), [searchQuery]);
  const unreadCount = notifList.filter((n) => !n.read).length;

  if (!session) return null;

  function markAllRead() {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
      <button
        onClick={() => setMobileNavOpen(true)}
        className="lg:hidden text-slate-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <h1 className="text-[15px] font-semibold text-white hidden sm:block flex-shrink-0 min-w-[120px]">
        {currentLabel}
      </h1>

      {/* Global search */}
      <div className="flex-1 max-w-md mx-auto sm:mx-0">
        <Dropdown
          align="left"
          width={340}
          open={searchOpen && searchResults.length > 0}
          onOpenChange={setSearchOpen}
          trigger={
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students, teachers, notices..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>
          }
        >
          <div className="max-h-[360px] overflow-y-auto py-2">
            {searchResults.map((r) => (
              <button
                key={`${r.module}_${r.id}`}
                onClick={() => {
                  setActiveModule(r.module);
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300 flex-shrink-0">
                  <Icon name={r.icon} size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{r.title}</p>
                  <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </Dropdown>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>

        {/* Notifications */}
        <Dropdown
          width={360}
          trigger={
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Notifications"
            >
              <Icon name="bell" size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse-ring" />
              )}
            </button>
          }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifList.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors",
                  !n.read && "bg-indigo-500/[0.04]"
                )}
              >
                <div className={cn("mt-0.5 flex-shrink-0", NOTIF_COLORS[n.type])}>
                  <Icon name={NOTIF_ICONS[n.type]} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </Dropdown>

        {/* User menu */}
        <Dropdown
          width={220}
          open={userMenuOpen}
          onOpenChange={setUserMenuOpen}
          trigger={
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.06] transition-colors">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-[10px] font-semibold text-white",
                  session.user.avatarColor
                )}
              >
                {session.user.avatarInitials}
              </div>
              <Icon name="chevronDown" size={14} className="text-slate-500 hidden sm:block" />
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
            <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
          </div>
          <div className="py-1.5">
            <UserMenuItem icon="user" label="My Profile" onClick={() => { setActiveModule("settings"); setUserMenuOpen(false); }} />
            <UserMenuItem icon="settings" label="Settings" onClick={() => { setActiveModule("settings"); setUserMenuOpen(false); }} />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}

function UserMenuItem({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
    >
      <Icon name={icon} size={15} className="text-slate-500" />
      {label}
    </button>
  );
}