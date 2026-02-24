import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Apply stored theme before first render to avoid flash
const storedTheme = localStorage.getItem("savishkar_theme") || "dark";
document.documentElement.classList.add(storedTheme);

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </ErrorBoundary>
);
