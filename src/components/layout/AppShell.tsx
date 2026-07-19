"use client";

import { useAppNav } from "@/store/AppNavContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { StudentsModule } from "@/components/modules/students/StudentsModule";
import { TeachersModule } from "@/components/modules/teachers/TeachersModule";
import { ParentsModule } from "@/components/modules/parents/ParentsModule";
import { ClassesModule } from "@/components/modules/classes/ClassesModule";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// APP SHELL
// The authenticated application frame: Sidebar + Topbar + routed content area.
// Module routing is a simple switch on `activeModule` — as each module is
// built in later phases, it gets added here. Unbuilt modules show a tasteful
// "coming in a later phase" placeholder rather than a blank screen.
// =============================================================================

const BUILT_MODULES = ["dashboard", "students", "teachers", "parents", "classes"];

export function AppShell() {
  const { activeModule } = useAppNav();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {activeModule === "dashboard" && <DashboardModule />}
          {activeModule === "students" && <StudentsModule />}
          {activeModule === "teachers" && <TeachersModule />}
          {activeModule === "parents" && <ParentsModule />}
          {activeModule === "classes" && <ClassesModule />}
          {!BUILT_MODULES.includes(activeModule) && <ComingSoonPlaceholder module={activeModule} />}
        </main>
      </div>
    </div>
  );
}

function ComingSoonPlaceholder({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center mb-4">
        <Icon name="zap" size={24} className="text-indigo-300" />
      </div>
      <h3 className="text-white font-semibold text-base capitalize">{module.replace(/-/g, " ")}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        This module is being built in an upcoming development phase.
      </p>
    </div>
  );
}