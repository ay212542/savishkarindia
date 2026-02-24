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

      {/* Rockets - Innovative flying elements with diverse paths */}
      <div className="absolute inset-0">
        {/* Diagonal Rockets - Strategic Flow */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`rocket-diag-${i}`}
            className="absolute animate-rocket-diagonal opacity-0"
            style={{
              '--rocket-duration': `${15 + i * 5}s`,
              '--rocket-delay': `${i * 8}s`,
              left: `${(i * 30) % 90}%`,
              top: '100%',
              scale: `${0.8 + (i % 3) * 0.2}`
            } as any}
          >
            <Rocket className="w-6 h-6 text-primary rocket-pulse" />
          </div>
        ))}

        {/* Vertical Rockets - Constant Growth */}
        {[...Array(2)].map((_, i) => (
          <div
            key={`rocket-up-${i}`}
            className="absolute animate-rocket-up opacity-0"
            style={{
              '--rocket-duration': `${18 + i * 4}s`,
              '--rocket-delay': `${i * 12 + 4}s`,
              left: `${20 + (i * 40) % 90}%`,
              top: '100%',
              scale: `${0.7 + (i % 2) * 0.3}`
            } as any}
          >
            <Rocket className="w-5 h-5 text-accent rocket-pulse" />
          </div>
        ))}

        {/* Cross-Screen Rockets - Global Impact */}
        {[...Array(2)].map((_, i) => (
          <div
            key={`rocket-across-${i}`}
            className="absolute animate-rocket-across opacity-0"
            style={{
              '--rocket-duration': `${20 + i * 6}s`,
              '--rocket-delay': `${i * 15 + 7}s`,
              left: '-10%',
              top: `${20 + (i * 30) % 80}%`,
              scale: `${0.9 + (i % 2) * 0.1}`
            } as any}
          >
            <Rocket className="w-5 h-5 text-savishkar-cyan rotate-90 rocket-pulse" />
          </div>
        ))}
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
