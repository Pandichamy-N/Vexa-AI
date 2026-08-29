import { useContext, useEffect, useState } from "react";
import { FaHistory } from "react-icons/fa";
import { getHistory } from "../api/videoApi";
import { LanguageContext } from "../context/LanguageContext";
import VideoCard from "../components/VideoCard";

function History() {

    const { t } = useContext(LanguageContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await getHistory(token);

            setVideos((res.data.history || []).slice().reverse());

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }
    };

    return (

        <div>

            <div className="flex items-center gap-3 mb-6">
                <FaHistory style={{ color: "var(--color-text-muted)" }} size={24} />
                <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("nav_history")}
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
                        {t("empty_history")}
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

export default History;
