import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-lg transition-colors ${className}`}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
            ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
            )}
        </Button>
    );
}
