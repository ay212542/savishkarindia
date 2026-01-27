import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    width?: "fit-content" | "100%";
}

export function ScrollReveal({ children, className, delay = 0, width = "100%" }: ScrollRevealProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            style={{ width }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
