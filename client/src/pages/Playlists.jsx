import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaList, FaTrash, FaChevronRight } from "react-icons/fa";
import {
    createPlaylist,
    getMyPlaylists,
    deletePlaylist,
} from "../services/playlistService";
import { LanguageContext } from "../context/LanguageContext";

function Playlists() {

    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        try {
            setLoading(true);
            const data = await getMyPlaylists();
            setPlaylists(data.playlists);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {

        if (!name.trim()) return;

        try {
            await createPlaylist(name);
            setName("");
            loadPlaylists();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Couldn't create playlist");
        }

    };

    const handleDelete = async (e, playlistId) => {

        e.stopPropagation(); // don't trigger the card's open-playlist click

        if (!confirm("Delete this playlist?")) return;

        try {
            await deletePlaylist(playlistId);
            setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
        } catch (error) {
            alert(error.response?.data?.message || "Couldn't delete playlist");
        }

    };

    return (

        <div>

            <div className="flex items-center gap-3 mb-8">
                <FaList style={{ color: "var(--color-brand)" }} size={24} />
                <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("nav_playlists")}
                </h1>
            </div>

            <div className="flex gap-4 mb-8">

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder={t("create_playlist_placeholder")}
                    className="px-4 py-3 rounded-lg flex-1 outline-none border"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <button
                    onClick={handleCreate}
                    className="brand-btn px-6 rounded-lg"
                >
                    {t("create")}
                </button>

            </div>

            {loading ? (

                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 rounded-xl animate-pulse"
                            style={{ backgroundColor: "var(--color-surface)" }}
                        />
                    ))}
                </div>

            ) : playlists.length === 0 ? (

                <div className="text-center mt-16">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        {t("no_videos_yet")}
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        {t("empty_playlists")}
                    </p>
                </div>

            ) : (

                <div className="space-y-4">

                    {playlists.map((playlist, index) => (

                        <div
                            key={playlist._id}
                            onClick={() => navigate(`/playlists/${playlist._id}`)}
                            className="media-card rounded-xl p-5 flex items-center justify-between cursor-pointer border animate-fade-up"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                borderColor: "var(--color-border-soft)",
                                animationDelay: `${Math.min(index, 10) * 40}ms`,
                            }}
                        >

                            <div>
                                <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                                    {playlist.name}
                                </h2>
                                <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                                    {playlist.videos.length} video{playlist.videos.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => handleDelete(e, playlist._id)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <FaTrash />
                                </button>
                                <FaChevronRight style={{ color: "var(--color-text-faint)" }} />
                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}

export default Playlists;
