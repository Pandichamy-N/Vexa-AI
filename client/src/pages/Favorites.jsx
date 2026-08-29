import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { getFavorites } from "../services/userService";
import VideoCard from "../components/VideoCard";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function Favorites() {

    const { t } = useContext(LanguageContext);

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await getFavorites();
            setVideos(res.favorites || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            <div className="flex items-center gap-3 mb-6">
                <FaHeart style={{ color: "#f87171" }} size={24} />
                <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("nav_favorites")}
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
                        {t("empty_favorites")}
                    </p>
                </div>

            ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {videos.map((video, index) => (
                        <div
                            key={video._id}
                            className="animate-fade-up"
                            style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                        >
                            <VideoCard video={video} />
                        </div>
                    ))}
                </div>

            )}

        </div>
    );
}

export default Favorites;
