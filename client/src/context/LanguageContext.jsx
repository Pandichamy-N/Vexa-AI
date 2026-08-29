import { createContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";

export const LanguageContext = createContext();

function LanguageProvider({ children }) {

    const [language, setLanguageState] = useState(
        localStorage.getItem("language") || "en"
    );

    useEffect(() => {
        localStorage.setItem("language", language);
    }, [language]);

    const setLanguage = (code) => {
        setLanguageState(code);
    };

    // t(key) — falls back to English, then to the key itself, so a
    // missing translation never renders blank.
    const t = (key) => {
        return (
            translations[language]?.[key] ||
            translations.en[key] ||
            key
        );
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export default LanguageProvider;
