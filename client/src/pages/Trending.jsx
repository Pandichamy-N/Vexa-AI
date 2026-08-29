import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegEye, FaThumbsUp, FaRobot, FaFire } from "react-icons/fa";
import { getTrendingVideos } from "../api/videoApi";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function Trending() {

    const { t } = useContext(LanguageContext);

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        try {
            setLoading(true);
            const res = await getTrendingVideos();
            setVideos(res.data);
        } catch (error) {
            console.log("Error fetching trending videos:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            <div className="flex items-center gap-3 mb-1">
                <FaFire style={{ color: "var(--color-brand)" }} size={26} />
                <h1
                    className="text-3xl font-bold"
                    style={{ color: "var(--color-text)" }}
                >
                    {t("nav_trending")}
                </h1>
            </div>

            <p
                className="mb-6 flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
            >
                <FaRobot style={{ color: "#5eead4" }} />
                Ranked automatically by an engagement + recency algorithm, with AI-written insights for the top picks.
            </p>

            {loading ? (

                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex gap-4 p-3 rounded-xl animate-pulse"
                            style={{ backgroundColor: "var(--color-surface)" }}
                        >
                            <div
                                className="w-44 h-24 rounded-lg shrink-0"
                                style={{ backgroundColor: "var(--color-surface-2)" }}
                            />
                            <div className="flex-1 space-y-2 py-2">
                                <div className="h-3 rounded w-2/3" style={{ backgroundColor: "var(--color-surface-2)" }} />
                                <div className="h-3 rounded w-1/3" style={{ backgroundColor: "var(--color-surface-2)" }} />
                            </div>
                        </div>
                    ))}
                </div>

            ) : videos.length === 0 ? (

                <div className="text-center mt-24">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        Nothing trending yet
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        Upload or import a few videos and the trending algorithm will start ranking them by engagement.
                    </p>
                </div>

            ) : (

                <div className="space-y-3">

                    {videos.map((video, index) => (

                        <div
                            key={video._id}
                            onClick={() => navigate(`/video/${video._id}`)}
                            className="flex gap-4 p-3 rounded-xl cursor-pointer border media-card animate-fade-up"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                borderColor: "var(--color-border-soft)",
                                animationDelay: `${Math.min(index, 12) * 35}ms`,
                            }}
                        >

                            {/* Rank */}
                            <div
                                className="w-10 flex items-center justify-center text-2xl font-bold shrink-0"
                                style={{
                                    fontFamily: "var(--font-display)",
                                    color: index < 3 ? "var(--color-brand)" : "var(--color-text-faint)",
                                }}
                            >
                                {index + 1}
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-44 h-24 shrink-0 rounded-lg overflow-hidden">
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                />
                                {video.duration && (
                                    <span
                                        className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-mono"
                                        style={{ backgroundColor: "rgba(18,18,18,0.85)", color: "var(--color-text)" }}
                                    >
                                        {video.duration}
                                    </span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 py-1">

                                <h3
                                    className="font-semibold line-clamp-1"
                                    style={{ color: "var(--color-text)" }}
                                >
                                    {video.title}
                                </h3>

                                <p
                                    className="text-sm mt-0.5"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    {video.channel}
                                </p>

                                <div
                                    className="flex items-center gap-3 text-xs mt-2"
                                    style={{ color: "var(--color-text-faint)" }}
                                >
                                    <span className="flex items-center gap-1">
                                        <FaRegEye /> {video.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FaThumbsUp /> {video.likes}
                                    </span>
                                    {video.category && (
                                        <span
                                            className="px-2 py-0.5 rounded-full border"
                                            style={{ borderColor: "var(--color-border)" }}
                                        >
                                            {video.category}
                                        </span>
                                    )}
                                </div>

                                {video.trendingInsight && (
                                    <p
                                        className="flex items-start gap-1.5 text-xs mt-2 ai-gradient-text"
                                    >
                                        <FaRobot className="mt-0.5 shrink-0" style={{ color: "#5eead4" }} />
                                        <span style={{ color: "#5eead4" }}>{video.trendingInsight}</span>
                                    </p>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default Trending;
