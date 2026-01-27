import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Settings, Code2, Database, Globe, Cpu, Zap, Wifi, Rocket } from "lucide-react";
import { useEffect } from "react";

export function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for the "magnetic" cursor follower
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    function handleMouseMove({ clientX, clientY }: MouseEvent) {
      mouseX.set(clientX);
      mouseY.set(clientY);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // 1. Rotating Gears (The "Engine" of Innovation)
  const gears = Array.from({ length: 6 }).map((_, i) => ({
    id: `gear-${i}`,
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    size: Math.random() * 50 + 40,
    duration: Math.random() * 20 + 15,
    direction: i % 2 === 0 ? 360 : -360,
    opacity: 0.08,
    delay: Math.random() * 2
  }));

  // 2. Floating Tech Icons
  const icons = Array.from({ length: 12 }).map((_, i) => ({
    id: `icon-${i}`,
    icon: [Code2, Database, Globe, Cpu, Zap, Wifi][i % 6],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20 + 20,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.06 + 0.04,
  }));

  // 3. Pulse "Radar" Waves
  const pulses = Array.from({ length: 4 }).map((_, i) => ({
    id: `pulse-${i}`,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    delay: i * 3,
  }));

  // 4. Mini Flying Rockets with High-Vis Boosters
  const rockets = Array.from({ length: 8 }).map((_, i) => ({
    id: `rocket-${i}`,
    left: Math.random() * 100,
    duration: Math.random() * 15 + 10, // 10-25s duration
    delay: Math.random() * 10,
    scale: Math.random() * 0.4 + 0.6,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Space Background Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-background to-background" />

      {/* Primary Cursor Spotlight (Large Ambient) */}
      <motion.div
        className="absolute inset-0 z-10 opacity-40"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(56, 189, 248, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* Secondary Cursor Core (Bright "Magnetic" Glow) */}
      <motion.div
        className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl z-10 pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%"
        }}
      />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
          backgroundSize: '6rem 6rem'
        }}
      />

      {/* 1. Rotating Gears */}
      {gears.map((gear) => (
        <motion.div
          key={gear.id}
          className="absolute text-slate-500/20"
          style={{
            left: `${gear.x}%`,
            top: `${gear.y}%`,
          }}
          animate={{ rotate: gear.direction }}
          transition={{
            duration: gear.duration,
            repeat: Infinity,
            ease: "linear",
            delay: gear.delay
          }}
        >
          <Settings size={gear.size} strokeWidth={1} />
        </motion.div>
      ))}

      {/* 2. Floating Tech Icons */}
      {icons.map((el) => (
        <motion.div
          key={el.id}
          className="absolute text-primary"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, el.opacity, el.opacity, 0],
            y: [-30, 30],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: el.delay,
          }}
        >
          <el.icon size={el.size} strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* 3. Pulse Waves */}
      {pulses.map((pulse) => (
        <motion.div
          key={pulse.id}
          className="absolute border border-blue-500/20 rounded-full"
          style={{
            left: `${pulse.x}%`,
            top: `${pulse.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{
            width: ["0px", "500px"],
            height: ["0px", "500px"],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeOut",
            delay: pulse.delay
          }}
        />
      ))}

      {/* 4. Mini Flying Rockets */}
      {rockets.map((r) => (
        <motion.div
          key={r.id}
          className="absolute text-cyan-400/80"
          initial={{ bottom: "-10%", left: `${r.left}%`, opacity: 0 }}
          animate={{
            bottom: "120%",
            left: `${r.left + 20}%`,
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: r.duration,
            repeat: Infinity,
            ease: "linear",
            delay: r.delay,
          }}
          style={{ scale: r.scale }}
        >
          <div className="relative transform rotate-45">
            <Rocket size={36} strokeWidth={1.5} fill="currentColor" fillOpacity={0.1} className="drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
            {/* VIBRANT Engine Flaming Booster Effect */}
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 w-2 bg-gradient-to-b from-cyan-300 via-blue-500 to-transparent blur-[2px]"
              animate={{ height: ["20px", "45px", "20px"], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-12 bg-cyan-500/30 blur-md rounded-full"
              animate={{ height: ["30px", "60px", "30px"] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      ))}

      {/* 5. Floating Keywords (Ideation, Scaling, Incubation) */}
      {[
        { text: "IDEATION", x: 15, y: 25, delay: 0 },
        { text: "SCALING", x: 80, y: 60, delay: 2 },
        { text: "INCUBATION", x: 40, y: 85, delay: 4 },
        { text: "INNOVATION", x: 70, y: 20, delay: 6 }, // Bonus word
      ].map((word, i) => (
        <motion.div
          key={i}
          className="absolute text-xs md:text-sm font-bold tracking-[0.3em] text-cyan-900/40 pointer-events-none select-none font-mono"
          style={{ left: `${word.x}%`, top: `${word.y}%` }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: word.delay
          }}
        >
          {word.text}
        </motion.div>
      ))}

      {/* Ambient Glows */}
      <motion.div
        className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-cyan-500/5 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[100px]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
