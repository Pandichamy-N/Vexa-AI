import { useContext } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";

function ThemeToggle() {

    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform active:scale-90"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
            {theme === "dark" ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>
    );
}

export default ThemeToggle;
