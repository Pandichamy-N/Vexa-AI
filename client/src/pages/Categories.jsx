import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";
import { getCategorizedVideos } from "../api/videoApi";
import VideoCard from "../components/VideoCard";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

const CATEGORY_ORDER = [
    "Education",
    "Programming",
    "Technology",
    "Gaming",
    "Music",
    "Entertainment",
    "Sports",
    "General",
];

function Categories() {

    const { t } = useContext(LanguageContext);

    const [grouped, setGrouped] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategorized();
    }, []);

    const fetchCategorized = async () => {
        try {
            setLoading(true);
            const res = await getCategorizedVideos();
            setGrouped(res.data);
        } catch (error) {
            console.log("Error fetching categorized videos:", error);
        } finally {
            setLoading(false);
        }
    };

    const categoryNames = Object.keys(grouped).sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    return (
        <div>

            <h1
                className="text-3xl font-bold mb-1"
                style={{ color: "var(--color-text)" }}
            >
                📂 {t("nav_categories")}
            </h1>

            <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>
                Every video, grouped by category — the top pick in each is the one AI's trending ranking scores highest right now.
            </p>

            {loading ? (

                <div className="space-y-10">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i}>
                            <div
                                className="h-5 w-40 rounded mb-4 animate-pulse"
                                style={{ backgroundColor: "var(--color-surface-2)" }}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="h-[220px] rounded-2xl animate-pulse"
                                        style={{ backgroundColor: "var(--color-surface)" }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            ) : categoryNames.length === 0 ? (

                <div className="text-center mt-24">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        No videos yet
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        Upload or AI-import a few videos to see them grouped here.
                    </p>
                </div>

            ) : (

                <div className="space-y-10">

                    {categoryNames.map((category) => (

                        <section key={category}>

                            <div className="flex items-center justify-between mb-4">
                                <h2
                                    className="text-xl font-bold"
                                    style={{ color: "var(--color-text)" }}
                                >
                                    {category}
                                </h2>
                                <span
                                    className="text-xs px-2.5 py-1 rounded-full border"
                                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                                >
                                    {grouped[category].length} video{grouped[category].length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

                                {grouped[category].map((video, index) => (
                                    <div key={video._id} className="relative">

                                        {index === 0 && (
                                            <span
                                                className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold"
                                                style={{
                                                    backgroundColor: "var(--color-brand)",
                                                    color: "#ffffff",
                                                }}
                                            >
                                                <FaTrophy size={10} />
                                                {t("top_pick")}
                                            </span>
                                        )}

                                        <VideoCard video={video} />

                                    </div>
                                ))}

                            </div>

                        </section>

                    ))}

                </div>

            )}

        </div>
    );
}

export default Categories;
