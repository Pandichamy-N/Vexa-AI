import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaGraduationCap, FaCode, FaGamepad, FaMusic,
    FaMicrochip, FaFilm, FaFutbol, FaThLarge, FaCheck,
} from "react-icons/fa";
import { updateInterests } from "../api/userApi";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

const CATEGORIES = [
    { name: "Education", icon: <FaGraduationCap />, color: "#38bdf8" },
    { name: "Programming", icon: <FaCode />, color: "#2dd4bf" },
    { name: "Gaming", icon: <FaGamepad />, color: "#a78bfa" },
    { name: "Music", icon: <FaMusic />, color: "#f472b6" },
    { name: "Technology", icon: <FaMicrochip />, color: "#60a5fa" },
    { name: "Entertainment", icon: <FaFilm />, color: "#fb923c" },
    { name: "Sports", icon: <FaFutbol />, color: "#4ade80" },
    { name: "General", icon: <FaThLarge />, color: "#facc15" },
];

const MIN_SELECT = 3;

function Onboarding() {

    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);

    const toggle = (name) => {
        setSelected((prev) =>
            prev.includes(name)
                ? prev.filter((c) => c !== name)
                : [...prev, name]
        );
    };

    const handleContinue = async () => {

        if (selected.length < MIN_SELECT) return;

        try {
            setSaving(true);
            await updateInterests(selected);
            navigate("/");
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Couldn't save your picks. Try again.");
        } finally {
            setSaving(false);
        }

    };

    const canContinue = selected.length >= MIN_SELECT;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: "var(--color-ink)" }}
        >

            <div className="w-full max-w-2xl">

                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <VexaLogo size={40} />
                    </div>
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
                    >
                        {t("onboarding_title")}
                    </h1>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        {t("onboarding_subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">

                    {CATEGORIES.map((cat) => {
                        const isSelected = selected.includes(cat.name);
                        return (
                            <button
                                key={cat.name}
                                onClick={() => toggle(cat.name)}
                                className="relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-200"
                                style={{
                                    backgroundColor: isSelected ? "var(--color-surface-2)" : "var(--color-surface)",
                                    borderColor: isSelected ? cat.color : "var(--color-border)",
                                    borderWidth: isSelected ? "2px" : "1px",
                                    transform: isSelected ? "scale(1.03)" : "scale(1)",
                                    boxShadow: isSelected ? `0 8px 24px -8px ${cat.color}66` : "none",
                                }}
                            >
                                {isSelected && (
                                    <span
                                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: cat.color, color: "#0a0a0a" }}
                                    >
                                        <FaCheck size={10} />
                                    </span>
                                )}
                                <span style={{ color: cat.color, fontSize: "1.75rem" }}>
                                    {cat.icon}
                                </span>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: "var(--color-text)" }}
                                >
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}

                </div>

                <div className="flex flex-col items-center gap-3">

                    <p className="text-sm" style={{ color: canContinue ? "#5eead4" : "var(--color-text-faint)" }}>
                        {selected.length} {t("onboarding_selected")} {!canContinue && `— ${t("onboarding_min")}`}
                    </p>

                    <button
                        onClick={handleContinue}
                        disabled={!canContinue || saving}
                        className="brand-btn px-10 py-3 rounded-full font-semibold disabled:opacity-40"
                    >
                        {saving ? "..." : t("continue_btn")}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Onboarding;
