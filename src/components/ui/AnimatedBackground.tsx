// =============================================================================
// ANIMATED BACKGROUND
// Soft floating gradient blobs behind auth/marketing-style surfaces. Pure CSS
// animation (see globals.css `blob` keyframes), no JS animation library.
// =============================================================================

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-slate-950" />
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-25 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)", animationDelay: "-6s" }}
      />
      <div
        className="absolute top-[35%] right-[15%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)", animationDelay: "-12s" }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.08), transparent)" }}
      />
    </div>
  );
}