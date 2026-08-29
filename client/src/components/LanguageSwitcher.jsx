import { useContext, useState, useRef, useEffect } from "react";
import { FaGlobe } from "react-icons/fa";
import { LanguageContext } from "../context/LanguageContext";
import { LANGUAGES } from "../i18n/translations";
import { updateLanguagePref } from "../api/userApi";

function LanguageSwitcher({ variant = "compact" }) {

    const { language, setLanguage } = useContext(LanguageContext);
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        setLanguage(code);
        setOpen(false);

        // Best-effort: persist to the account too, if logged in.
        if (localStorage.getItem("token")) {
            updateLanguagePref(code).catch(() => {});
        }
    };

    const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    if (variant === "full") {
        // Entrance-page style: all 5 shown as chips, no dropdown.
        return (
            <div className="flex flex-wrap gap-2 justify-center">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        className="text-sm px-3 py-1.5 rounded-full border transition-colors"
                        style={
                            language === lang.code
                                ? { backgroundColor: "var(--color-brand)", color: "#ffffff", borderColor: "var(--color-brand)" }
                                : { borderColor: "var(--color-border)", color: "var(--color-text-muted)" }
                        }
                    >
                        {lang.native}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="relative" ref={boxRef}>

            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
                <FaGlobe size={11} />
                {current.native}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 rounded-lg border overflow-hidden z-50 animate-fade-up"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)",
                    }}
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className="block w-full text-left px-4 py-2 text-sm whitespace-nowrap hover:brightness-125"
                            style={{
                                color: language === lang.code ? "var(--color-brand)" : "var(--color-text)",
                            }}
                        >
                            {lang.native}
                        </button>
                    ))}
                </div>
            )}

        </div>
    );
}

export default LanguageSwitcher;
