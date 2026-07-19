"use client";

import type { Role } from "@/types";
import { getNavGroupsForRole } from "@/lib/navigation";
import { useAppNav } from "@/store/AppNavContext";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// SIDEBAR
// Persistent left navigation. Desktop: collapsible rail. Mobile: slide-over
// drawer. Nav items are pre-filtered by role via getNavGroupsForRole so no
// component ever branches on `role === "admin"` directly.
// =============================================================================

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } =
    useAppNav();
  const { session, logout } = useAuth();
  if (!session) return null;

  const groups = getNavGroupsForRole(session.user.role);

  return (
    <>
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-30 flex flex-col bg-slate-950/95 lg:bg-slate-950/60 border-r border-white/[0.06] backdrop-blur-xl transition-all duration-300 ease-out",
          sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[260px]",
          "w-[260px]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] flex-shrink-0",
            sidebarCollapsed && "lg:justify-center lg:px-0"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/25">
            <Icon name="graduationCap" size={16} className="text-white" />
          </div>
          <span
            className={cn(
              "font-semibold text-white text-[15px] tracking-tight whitespace-nowrap overflow-hidden transition-all",
              sidebarCollapsed && "lg:w-0 lg:opacity-0"
            )}
          >
            Brightfield
          </span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto lg:hidden text-slate-500 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-3 mb-1.5 whitespace-nowrap overflow-hidden transition-all",
                  sidebarCollapsed && "lg:opacity-0 lg:h-0 lg:mb-0"
                )}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeModule === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveModule(item.key)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group",
                        sidebarCollapsed && "lg:justify-center lg:px-0",
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-full" />
                      )}
                      <Icon
                        name={item.icon as never}
                        size={17}
                        className={cn("flex-shrink-0", isActive ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300")}
                      />
                      <span
                        className={cn(
                          "whitespace-nowrap overflow-hidden transition-all flex-1 text-left",
                          sidebarCollapsed && "lg:w-0 lg:opacity-0"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                        <span className="text-[10px] font-semibold bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: user + collapse toggle */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <div
            className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded-xl",
              sidebarCollapsed && "lg:justify-center"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0",
                session.user.avatarColor
              )}
            >
              {session.user.avatarInitials}
            </div>
            <div className={cn("min-w-0 flex-1", sidebarCollapsed && "lg:hidden")}>
              <p className="text-xs font-medium text-white truncate">{session.user.name}</p>
              <p className="text-[11px] text-slate-500 capitalize truncate">{session.user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className={cn("text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0", sidebarCollapsed && "lg:hidden")}
            >
              <Icon name="logOut" size={15} />
            </button>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-full items-center justify-center gap-2 mt-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={sidebarCollapsed ? "chevronRight" : "chevronLeft"} size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

export type { Role };