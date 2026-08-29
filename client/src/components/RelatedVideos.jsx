import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRelatedVideos } from "../api/videoApi";
import { LanguageContext } from "../context/LanguageContext";

function RelatedVideos({ currentId }) {

    const { t } = useContext(LanguageContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVideos();
    }, [currentId]);

    const fetchVideos = async () => {
        try {

            setLoading(true);

            const res = await getRelatedVideos(currentId);

            setVideos(res.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }
    };

    return (

        <div>

            <h2 className="text-2xl font-bold mb-5" style={{ color: "var(--color-text)" }}>
                Related Videos
            </h2>

            {loading ? (

                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-2">
                            <div className="w-40 h-24 rounded-lg animate-pulse shrink-0" style={{ backgroundColor: "var(--color-surface)" }} />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 rounded w-4/5 animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                                <div className="h-3 rounded w-2/5 animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                            </div>
                        </div>
                    ))}
                </div>

            ) : (

                <div className="space-y-4">

                    {videos.map((video) => (

                        <Link
                            key={video._id}
                            to={`/video/${video._id}`}
                        >

                            <div
                                className="flex gap-3 p-2 rounded-xl transition-colors hover:brightness-110"
                                style={{ backgroundColor: "transparent" }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >

                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-40 h-24 object-cover rounded-lg"
                                />

                                <div className="flex-1 min-w-0">

                                    <h3
                                        className="font-semibold line-clamp-2"
                                        style={{ color: "var(--color-text)" }}
                                    >
                                        {video.title}
                                    </h3>

                                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                                        {video.channel}
                                    </p>

                                    <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
                                        👁 {video.views} {t("views")}
                                    </p>

                                    <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                                        ⏰ {video.time}
                                    </p>

                                </div>

                            </div>

                        </Link>

                    ))}

                </div>

            )}

        </div>

    );
}

export default RelatedVideos;
