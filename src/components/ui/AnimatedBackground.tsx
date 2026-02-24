import { Rocket } from "lucide-react";

// Lightweight static background — replaces the heavy Framer Motion AnimatedBackground
// Uses CSS animations only (GPU-accelerated, no JS overhead)
export function AnimatedBackground() {
  const stars = Array.from({ length: 30 });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950/60 via-background to-background" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
          backgroundSize: '6rem 6rem'
        }}
      />

      <div className="absolute inset-0">
        {/* Rockets removed for extreme performance optimization */}
      </div>

      {/* Twinkling Stars */}
      {stars.map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5
          }}
        />
      ))}

      {/* Ambient glows — CSS animated, GPU composited */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-cyan-400/15 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
    </div>
  );
}
