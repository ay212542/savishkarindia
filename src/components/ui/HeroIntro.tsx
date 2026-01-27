import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function HeroIntro() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Disabled session check for testing - Animation flows every time
        // const hasRun = sessionStorage.getItem("savishkar_intro_shown");
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    const letters = "SAVISHKAR".split("");

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden"
                >
                    <div className="relative">
                        <div className="flex gap-2 md:gap-4 overflow-hidden">
                            {letters.map((letter, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: i * 0.1, // Stagger effect
                                        type: "spring",
                                        damping: 12,
                                        stiffness: 100
                                    }}
                                    className="text-4xl md:text-6xl lg:text-8xl font-display font-bold text-gradient-hero inline-block"
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </div>

                        {/* Decoration line */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="h-1 w-full bg-primary mt-4 rounded-full"
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5, duration: 0.8 }}
                            className="text-center mt-4 text-muted-foreground font-light tracking-[0.2em] uppercase text-sm md:text-base"
                        >
                            National Innovation Command Ecosystem
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
