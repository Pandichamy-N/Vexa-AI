import { useContext, useEffect, useState } from "react";
import { FaBookmark, FaTrash } from "react-icons/fa";
import { getWatchLater, removeWatchLater } from "../api/videoApi";
import { LanguageContext } from "../context/LanguageContext";
import VideoCard from "../components/VideoCard";

function WatchLater() {

    const { t } = useContext(LanguageContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWatchLater();
    }, []);

    const fetchWatchLater = async () => {
        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await getWatchLater(token);

            setVideos(res.data.watchLater || []);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }
    };

    const handleRemove = async (e, id) => {

        e.stopPropagation();

        try {

            const token = localStorage.getItem("token");

            await removeWatchLater(id, token);

            setVideos((prev) => prev.filter((video) => video._id !== id));

        } catch (error) {

            console.log(error);
            alert("Couldn't remove — try again.");

        }

    };

    return (

        <div>

            <div className="flex items-center gap-3 mb-6">
                <FaBookmark style={{ color: "var(--color-brand)" }} size={22} />
                <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("nav_watchlater")}
                </h1>
            </div>

            {loading ? (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[220px] rounded-2xl animate-pulse"
                            style={{ backgroundColor: "var(--color-surface)" }}
                        />
                    ))}
                </div>

            ) : videos.length === 0 ? (

                <div className="text-center mt-16">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        {t("no_videos_yet")}
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        {t("empty_watchlater")}
                    </p>
                </div>

            ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {videos.map((video, index) => (
                        <div
                            key={video._id}
                            className="relative animate-fade-up"
                            style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                        >

                            <button
                                onClick={(e) => handleRemove(e, video._id)}
                                title="Remove"
                                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "rgba(18,18,18,0.85)", color: "#f87171" }}
                            >
                                <FaTrash size={11} />
                            </button>

                            <VideoCard video={video} />

                        </div>
                    ))}
                </div>

            )}

        </div>

    );

}

export default WatchLater;
