import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaList, FaArrowLeft, FaTrash } from "react-icons/fa";
import { getPlaylistById, removeVideoFromPlaylist } from "../services/playlistService";
import VideoCard from "../components/VideoCard";
import { LanguageContext } from "../context/LanguageContext";

function PlaylistDetail() {

    const { t } = useContext(LanguageContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlaylist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getPlaylistById(id);
            setPlaylist(data.playlist);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Couldn't load this playlist.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e, videoId) => {
        e.stopPropagation();

        try {
            await removeVideoFromPlaylist(id, videoId);
            setPlaylist((prev) => ({
                ...prev,
                videos: prev.videos.filter((v) => v._id !== videoId),
            }));
        } catch (err) {
            alert(err.response?.data?.message || "Couldn't remove video");
        }
    };

    if (loading) {
        return (
            <div>
                <div className="h-8 w-48 rounded mb-6 animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[220px] rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="text-center mt-16">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                    {error || "Playlist not found"}
                </h2>
                <Link to="/playlists" style={{ color: "var(--color-brand)" }}>
                    ← {t("back")}
                </Link>
            </div>
        );
    }

    return (
        <div>

            <button
                onClick={() => navigate("/playlists")}
                className="flex items-center gap-2 text-sm mb-6"
                style={{ color: "var(--color-text-muted)" }}
            >
                <FaArrowLeft size={12} />
                {t("back")}
            </button>

            <div className="flex items-center gap-3 mb-8">
                <FaList style={{ color: "var(--color-brand)" }} size={24} />
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                        {playlist.name}
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {playlist.videos.length} video{playlist.videos.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {playlist.videos.length === 0 ? (

                <div className="text-center mt-16">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        No videos in this playlist yet
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        Open any video and use "Save" to add it here.
                    </p>
                </div>

            ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {playlist.videos.map((video, index) => (
                        <div key={video._id} className="relative animate-fade-up" style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}>

                            <button
                                onClick={(e) => handleRemove(e, video._id)}
                                title="Remove from playlist"
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

export default PlaylistDetail;
