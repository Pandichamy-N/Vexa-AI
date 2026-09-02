import { useContext, useEffect, useState } from "react";
import {
    FaSearch, FaCrown, FaHeart, FaList, FaCompass, FaHistory, FaPlus,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import MusicCard from "../components/MusicCard";
import VexaMusicLogo from "../components/VexaMusicLogo";
import AddMusicModal from "../components/AddMusicModal";
import { searchMusic, getFavoriteTracks, getRecentlyPlayed } from "../api/musicApi";
import { getProfile } from "../services/userService";
import { getMyPlaylists, createPlaylist, getPlaylistById } from "../services/playlistService";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";

const TABS = [
    { key: "browse", label: "Browse", icon: <FaCompass size={12} /> },
    { key: "liked", label: "Liked Songs", icon: <FaHeart size={12} /> },
    { key: "recent", label: "Recently Played", icon: <FaHistory size={12} /> },
    { key: "playlists", label: "My Playlists", icon: <FaList size={12} /> },
];

function VexaMusic() {

    const { t } = useContext(LanguageContext);
    const { showToast } = useContext(ToastContext);

    const [tab, setTab] = useState("browse");
    const [isPremium, setIsPremium] = useState(false);
    const [showAddMusic, setShowAddMusic] = useState(false);

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Liked Songs
    const [likedSongs, setLikedSongs] = useState([]);
    const [likedLoading, setLikedLoading] = useState(true);

    // Recently Played
    const [recentTracks, setRecentTracks] = useState([]);
    const [recentLoading, setRecentLoading] = useState(true);

    // My Playlists
    const [playlists, setPlaylists] = useState([]);
    const [playlistsLoading, setPlaylistsLoading] = useState(true);
    const [openPlaylist, setOpenPlaylist] = useState(null);
    const [openPlaylistTracks, setOpenPlaylistTracks] = useState([]);
    const [openPlaylistLoading, setOpenPlaylistLoading] = useState(false);

    useEffect(() => {
        getProfile().then((data) => setIsPremium(Boolean(data.user?.isPremium))).catch(() => {});
    }, []);

    useEffect(() => {
        if (tab === "liked" && likedSongs.length === 0) loadLikedSongs();
        if (tab === "recent" && recentTracks.length === 0) loadRecent();
        if (tab === "playlists" && playlists.length === 0) loadPlaylists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const loadLikedSongs = async () => {
        try {
            setLikedLoading(true);
            const res = await getFavoriteTracks();
            setLikedSongs(res.data.tracks || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLikedLoading(false);
        }
    };

    const loadRecent = async () => {
        try {
            setRecentLoading(true);
            const res = await getRecentlyPlayed();
            setRecentTracks(res.data.tracks || []);
        } catch (error) {
            console.log(error);
        } finally {
            setRecentLoading(false);
        }
    };

    const loadPlaylists = async () => {
        try {
            setPlaylistsLoading(true);
            const data = await getMyPlaylists();
            setPlaylists(data.playlists || []);
        } catch (error) {
            console.log(error);
        } finally {
            setPlaylistsLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        const name = prompt("Playlist name:");
        if (!name?.trim()) return;
        try {
            const data = await createPlaylist(name.trim());
            setPlaylists((prev) => [data.playlist, ...prev]);
            showToast(`Playlist "${name.trim()}" created`, "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Couldn't create playlist", "error");
        }
    };

    const handleOpenPlaylist = async (playlist) => {
        setOpenPlaylist(playlist);
        try {
            setOpenPlaylistLoading(true);
            const data = await getPlaylistById(playlist._id);
            setOpenPlaylistTracks(data.playlist?.tracks || []);
        } catch (error) {
            console.log(error);
        } finally {
            setOpenPlaylistLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            setSearching(true);
            const res = await searchMusic(query.trim());
            setSearchResults(res.data.tracks || []);
            setHasMore(res.data.hasMore);
            setNextPageToken(res.data.nextPageToken || null);
        } catch (error) {
            console.log(error);
        } finally {
            setSearching(false);
        }
    };

    const handleLoadMoreSearch = async () => {
        if (!hasMore || loadingMore) return;
        try {
            setLoadingMore(true);
            const res = await searchMusic(query.trim(), nextPageToken);
            const existingIds = new Set(searchResults.map((t) => t._id));
            const fresh = (res.data.tracks || []).filter((t) => !existingIds.has(t._id));
            setSearchResults((prev) => [...prev, ...fresh]);
            setHasMore(res.data.hasMore);
            setNextPageToken(res.data.nextPageToken || null);
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingMore(false);
        }
    };

    const backToBrowse = () => {
        setSearchResults(null);
        setQuery("");
    };

    return (
        <>
        <div>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">

                <div className="flex items-center gap-3">
                    <VexaMusicLogo size={30} />
                    <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                        VEXA <span className="ai-gradient-text">Music</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddMusic(true)}
                        className="flex items-center gap-2 brand-btn px-4 py-2 rounded-full text-sm"
                    >
                        <FaPlus size={12} />
                        Add Music
                    </button>

                    {!isPremium && (
                        <Link to="/premium" className="flex items-center gap-2 ai-btn px-4 py-2 rounded-full text-sm">
                            <FaCrown size={12} />
                            {t("ad_go_premium")}
                        </Link>
                    )}
                </div>

            </div>

            <div
                className="flex flex-wrap rounded-full p-1 mb-8 w-fit border"
                style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
            >
                {TABS.map((tb) => (
                    <button
                        key={tb.key}
                        onClick={() => setTab(tb.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${tab === tb.key ? "brand-btn" : ""}`}
                        style={tab !== tb.key ? { color: "var(--color-text-muted)" } : {}}
                    >
                        {tb.icon}
                        {tb.label}
                    </button>
                ))}
            </div>

            {/* ================= BROWSE TAB ================= */}
            {tab === "browse" && (

                <>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
                        <div
                            className="flex items-center flex-1 rounded-full px-4 py-2.5 border"
                            style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                        >
                            <FaSearch style={{ color: "var(--color-text-faint)" }} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("music_search_placeholder")}
                                className="bg-transparent outline-none ml-3 w-full text-sm"
                                style={{ color: "var(--color-text)" }}
                            />
                        </div>
                        <button type="submit" className="brand-btn px-5 py-2 rounded-full text-sm">
                            {searching ? "..." : "Search"}
                        </button>
                    </form>

                    {searchResults ? (

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                                    Results for "{query}"
                                </h2>
                                <button onClick={backToBrowse} className="text-sm" style={{ color: "var(--color-brand)" }}>
                                    ← Back to browse
                                </button>
                            </div>

                            {searchResults.length === 0 ? (
                                <p style={{ color: "var(--color-text-muted)" }}>No matches — try a different search.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                                        {searchResults.map((track) => (
                                            <MusicCard key={track._id} track={track} queue={searchResults} isPremium={isPremium} />
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center mt-6">
                                            <button
                                                onClick={handleLoadMoreSearch}
                                                disabled={loadingMore}
                                                className="ai-btn px-6 py-2.5 rounded-full text-sm disabled:opacity-50"
                                            >
                                                {loadingMore ? "Loading..." : "Load More Results"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    ) : (

                        <div className="text-center mt-16">
                            <FaCompass className="mx-auto mb-3" size={28} style={{ color: "var(--color-text-faint)" }} />
                            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>Search for something to play</h2>
                            <p style={{ color: "var(--color-text-muted)" }}>Find any song or artist to start listening.</p>
                        </div>

                    )}
                </>

            )}

            {/* ================= LIKED SONGS TAB ================= */}
            {tab === "liked" && (
                <section>
                    {likedLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                            ))}
                        </div>
                    ) : likedSongs.length === 0 ? (
                        <div className="text-center mt-16">
                            <FaHeart className="mx-auto mb-3" size={28} style={{ color: "var(--color-text-faint)" }} />
                            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>No liked songs yet</h2>
                            <p style={{ color: "var(--color-text-muted)" }}>Hit the heart icon in the player to save songs here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {likedSongs.map((track) => (
                                <MusicCard key={track._id} track={track} queue={likedSongs} isPremium={isPremium} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ================= RECENTLY PLAYED TAB ================= */}
            {tab === "recent" && (
                <section>
                    {recentLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                            ))}
                        </div>
                    ) : recentTracks.length === 0 ? (
                        <div className="text-center mt-16">
                            <FaHistory className="mx-auto mb-3" size={28} style={{ color: "var(--color-text-faint)" }} />
                            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>Nothing played yet</h2>
                            <p style={{ color: "var(--color-text-muted)" }}>Tracks you play will show up here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recentTracks.map((track) => (
                                <MusicCard key={track._id} track={track} queue={recentTracks} isPremium={isPremium} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ================= MY PLAYLISTS TAB ================= */}
            {tab === "playlists" && (
                <section>

                    {openPlaylist ? (

                        <div>
                            <button onClick={() => setOpenPlaylist(null)} className="text-sm mb-4" style={{ color: "var(--color-brand)" }}>
                                ← All Playlists
                            </button>

                            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
                                📂 {openPlaylist.name}
                            </h2>

                            {openPlaylistLoading ? (
                                <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
                            ) : openPlaylistTracks.length === 0 ? (
                                <p style={{ color: "var(--color-text-muted)" }}>
                                    No tracks in this playlist yet — add some from the Music player's + button.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {openPlaylistTracks.map((track) => (
                                        <MusicCard key={track._id} track={track} queue={openPlaylistTracks} isPremium={isPremium} source="playlist" />
                                    ))}
                                </div>
                            )}
                        </div>

                    ) : (

                        <>
                            <button onClick={handleCreatePlaylist} className="flex items-center gap-2 brand-btn px-4 py-2 rounded-full text-sm mb-6">
                                New Playlist
                            </button>

                            {playlistsLoading ? (
                                <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
                            ) : playlists.length === 0 ? (
                                <p style={{ color: "var(--color-text-muted)" }}>No playlists yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {playlists.map((pl) => (
                                        <button
                                            key={pl._id}
                                            onClick={() => handleOpenPlaylist(pl)}
                                            className="media-card rounded-2xl p-5 border text-left flex flex-col gap-3"
                                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border-soft)" }}
                                        >
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: "var(--color-brand-soft)", color: "var(--color-brand)" }}
                                            >
                                                <FaList size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold truncate" style={{ color: "var(--color-text)" }}>{pl.name}</p>
                                                <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                                                    {(pl.tracks?.length || 0) + (pl.videos?.length || 0)} item{((pl.tracks?.length || 0) + (pl.videos?.length || 0)) !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>

                    )}

                </section>
            )}

        </div>

            {showAddMusic && (
                <AddMusicModal
                    onClose={() => setShowAddMusic(false)}
                    onAdded={() => {
                        setShowAddMusic(false);
                        showToast("Music added", "success");
                        // Recently Played / Liked lists are per-user activity,
                        // not affected by an add — but if someone's sitting on
                        // the browse tab with old search results open, back
                        // them out so the fresh track is discoverable again.
                        setSearchResults(null);
                        setQuery("");
                    }}
                />
            )}
        </>
    );
}

export default VexaMusic;
