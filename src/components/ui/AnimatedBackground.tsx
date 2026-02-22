// Lightweight static background — replaces the heavy Framer Motion AnimatedBackground
// Uses CSS animations only (GPU-accelerated, no JS overhead)
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-background to-background" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
          backgroundSize: '6rem 6rem'
        }}
      />

      {/* Ambient glows — CSS animated, GPU composited */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-primary/3 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "6s" }} />
    </div>
  );
}
