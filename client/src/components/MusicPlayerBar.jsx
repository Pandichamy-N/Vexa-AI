import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaPlay, FaPause, FaStepForward, FaStepBackward, FaTimes, FaCrown,
    FaHeart, FaRegHeart, FaPlus, FaCheck, FaListUl, FaRobot,
    FaDownload, FaCut, FaRandom, FaRedo, FaVolumeUp, FaVolumeMute,
} from "react-icons/fa";
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";
import { toggleFavoriteTrack, checkFavoriteTrack } from "../api/musicApi";
import { getProfile } from "../services/userService";
import { getMyPlaylists, addTrackToPlaylist } from "../services/playlistService";
import { getDownloadUrl } from "../utils/cloudinaryDownload";
import RingtoneTrimmerModal from "./RingtoneTrimmerModal";

const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

function MusicPlayerBar() {

    const navigate = useNavigate();
    const { t } = useContext(LanguageContext);
    const { showToast } = useContext(ToastContext);
    const {
        currentTrack, queue, isPlaying, progress, duration,
        autoNext, queueLoading, shuffle, repeat, volume,
        adActive, adSecondsLeft, adDuration, currentAd,
        togglePlay, skipNext, skipPrevious, seekTo, closePlayer, playTrack,
        toggleShuffle, cycleRepeat, setVolume,
    } = useContext(MusicPlayerContext);

    const [favorited, setFavorited] = useState(false);
    const [showPlaylists, setShowPlaylists] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [showRingtoneTrimmer, setShowRingtoneTrimmer] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [addedTo, setAddedTo] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const playlistBoxRef = useRef(null);
    const queueBoxRef = useRef(null);

    useEffect(() => {
        getProfile().then((data) => setIsPremium(Boolean(data.user?.isPremium))).catch(() => {});
    }, []);

    useEffect(() => {
        if (!currentTrack) return;
        checkFavoriteTrack(currentTrack._id)
            .then((res) => setFavorited(res.data.favorited))
            .catch(() => {});
    }, [currentTrack]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (playlistBoxRef.current && !playlistBoxRef.current.contains(e.target)) {
                setShowPlaylists(false);
            }
            if (queueBoxRef.current && !queueBoxRef.current.contains(e.target)) {
                setShowQueue(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!currentTrack) return null;

    const progressPct = duration ? (progress / duration) * 100 : 0;
    const adPct = ((adDuration - adSecondsLeft) / adDuration) * 100;

    // Freshly blended tracks get appended to the end of the queue, but
    // the same track can also still be sitting earlier in it (e.g. it
    // was also part of the original search results) — finding the
    // LAST match (not the first) is what keeps this pointed at the
    // track that's actually playing right now, not a stale earlier copy.
    let currentIndex = -1;
    for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i]._id === currentTrack._id) {
            currentIndex = i;
            break;
        }
    }
    const upNext = queue.slice(currentIndex + 1);
    const canDownload = currentTrack.downloadAllowed && isPremium;

    const handleSeek = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        seekTo(Math.max(0, Math.min(duration, ratio * duration)));
    };

    const handleToggleFavorite = async () => {
        try {
            const result = await toggleFavoriteTrack(currentTrack._id);
            setFavorited(result.data.favorited);
            showToast(
                result.data.favorited ? "Added to Liked Songs ❤️" : "Removed from Liked Songs",
                "success"
            );
        } catch (error) {
            console.log(error);
            showToast("Couldn't update favorites", "error");
        }
    };

    const handleOpenPlaylists = async () => {
        setShowPlaylists(!showPlaylists);
        setAddedTo(null);
        if (!showPlaylists && playlists.length === 0) {
            try {
                const data = await getMyPlaylists();
                setPlaylists(data.playlists || []);
            } catch (error) {
                console.log(error);
            }
        }
    };

    const handleAddToPlaylist = async (playlistId, playlistName) => {
        try {
            await addTrackToPlaylist(playlistId, currentTrack._id);
            setAddedTo(playlistId);
            showToast(`Added to "${playlistName}"`, "success");
        } catch (error) {
            console.log(error);
            showToast(error.response?.data?.message || "Couldn't add to playlist", "error");
        }
    };

    const handleDownload = () => {
        const url = getDownloadUrl(currentTrack.downloadUrl, `${currentTrack.artist} - ${currentTrack.title}`);
        window.open(url, "_blank", "noopener,noreferrer");
        showToast("Download started", "success");
    };

    const handleVolumeChange = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(ratio);
    };

    return (
        <div
            className="fixed bottom-4 left-1/2 z-40 w-[min(94vw,760px)] rounded-2xl border shadow-lg animate-fade-up-center"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                boxShadow: "0 16px 40px -12px rgba(0,0,0,0.5)",
            }}
        >

            {/* ================= AD BREAK ================= */}
            {adActive ? (

                <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                            <span
                                className="text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0"
                                style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                            >
                                {t("ad_playing")}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                                    {currentAd?.brand}
                                </p>
                                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                                    {currentAd?.tagline} · resumes in {adSecondsLeft}s
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/premium")}
                            className="flex items-center gap-2 ai-btn px-4 py-1.5 rounded-full text-xs shrink-0"
                        >
                            <FaCrown size={11} />
                            {t("ad_go_premium")}
                        </button>
                    </div>

                    <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: "var(--color-surface-2)" }}>
                        <div
                            className="h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${adPct}%`, backgroundColor: "var(--color-brand)" }}
                        />
                    </div>
                </div>

            ) : (

                <>

                    {/* ================= UP NEXT PANEL ================= */}
                    {showQueue && (
                        <div ref={queueBoxRef} className="max-h-64 overflow-y-auto border-b px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
                            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide px-1 pb-2" style={{ color: "var(--color-text-faint)" }}>
                                <FaRobot size={9} style={{ color: "#5eead4" }} />
                                Up Next
                            </p>

                            {upNext.length === 0 ? (
                                <p className="text-xs px-1 pb-2" style={{ color: "var(--color-text-faint)" }}>
                                    {queueLoading ? "Finding more like this..." : "Queue is empty — more similar tracks load automatically once this one ends."}
                                </p>
                            ) : (
                                upNext.map((track) => (
                                    <div
                                        key={track._id}
                                        onClick={() => playTrack(track, queue, isPremium)}
                                        className="flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer hover:brightness-125"
                                    >
                                        <img src={track.cover} alt={track.title} className="w-9 h-9 rounded object-cover shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs truncate" style={{ color: "var(--color-text)" }}>{track.title}</p>
                                            <p className="text-[10px] truncate" style={{ color: "var(--color-text-faint)" }}>{track.artist}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ================= NOW PLAYING ================= */}
                    <div className="flex items-center gap-2 px-4 py-2.5">

                        <div className="relative shrink-0">
                            <img
                                src={currentTrack.cover}
                                alt={currentTrack.title}
                                className={`w-11 h-11 rounded-lg object-cover ${isPlaying ? "now-playing-glow vinyl-spin" : ""}`}
                            />
                            {isPlaying && (
                                <span
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                                >
                                    <span className="now-playing-eq">
                                        <span></span><span></span><span></span>
                                    </span>
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 sm:flex-none sm:w-32">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                                {currentTrack.title}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--color-text-faint)" }}>
                                {queueLoading ? "Finding similar tracks..." : currentTrack.artist}
                            </p>
                        </div>

                        <div className="hidden lg:flex items-center gap-2.5 shrink-0">

                            <div className="relative" ref={playlistBoxRef}>
                                <button onClick={handleOpenPlaylists} title="Add to playlist" style={{ color: "var(--color-text-faint)" }}>
                                    <FaPlus size={12} />
                                </button>

                                {showPlaylists && (
                                    <div
                                        className="absolute bottom-8 left-0 w-56 rounded-xl border overflow-hidden z-50 animate-fade-up max-h-56 overflow-y-auto"
                                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)" }}
                                    >
                                        {playlists.length === 0 ? (
                                            <p className="p-3 text-xs" style={{ color: "var(--color-text-faint)" }}>
                                                No playlists yet — create one from the Playlists page.
                                            </p>
                                        ) : (
                                            playlists.map((pl) => (
                                                <button
                                                    key={pl._id}
                                                    onClick={() => handleAddToPlaylist(pl._id, pl.name)}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:brightness-125"
                                                    style={{ color: "var(--color-text)" }}
                                                >
                                                    📂 {pl.name}
                                                    {addedTo === pl._id && <FaCheck style={{ color: "#5eead4" }} />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {canDownload && (
                                <>
                                    <button onClick={handleDownload} title="Download" style={{ color: "var(--color-text-faint)" }}>
                                        <FaDownload size={12} />
                                    </button>
                                    <button onClick={() => setShowRingtoneTrimmer(true)} title="Trim a ringtone" style={{ color: "var(--color-text-faint)" }}>
                                        <FaCut size={12} />
                                    </button>
                                </>
                            )}

                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">

                            <button onClick={handleToggleFavorite} title={t("favorite")} style={{ color: favorited ? "#f87171" : "var(--color-text-faint)" }}>
                                {favorited ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
                            </button>

                            <button
                                onClick={isPremium ? toggleShuffle : () => navigate("/premium")}
                                title={isPremium ? (shuffle ? "Shuffle: on" : "Shuffle: off") : "Shuffle is a Premium feature"}
                                className="relative"
                                style={{ color: !isPremium ? "var(--color-text-faint)" : shuffle ? "#5eead4" : "var(--color-text-faint)", opacity: isPremium ? 1 : 0.5 }}
                            >
                                <FaRandom size={12} />
                                {!isPremium && (
                                    <FaCrown size={7} className="absolute -top-1.5 -right-1.5" style={{ color: "var(--color-brand)" }} />
                                )}
                            </button>

                            <button onClick={skipPrevious} style={{ color: "var(--color-text-muted)" }} title="Previous">
                                <FaStepBackward size={15} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                            >
                                {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} style={{ marginLeft: "1px" }} />}
                            </button>

                            <button onClick={skipNext} style={{ color: "var(--color-text-muted)" }} title="Next">
                                <FaStepForward size={15} />
                            </button>

                            <button
                                onClick={cycleRepeat}
                                title={`Repeat: ${repeat}`}
                                className="hidden sm:block relative"
                                style={{ color: repeat !== "off" ? "#5eead4" : "var(--color-text-faint)" }}
                            >
                                <FaRedo size={12} />
                                {repeat === "one" && (
                                    <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold" style={{ color: "#5eead4" }}>1</span>
                                )}
                            </button>

                        </div>

                        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs w-9 text-right shrink-0" style={{ color: "var(--color-text-faint)" }}>
                                {formatTime(progress)}
                            </span>
                            <div onClick={handleSeek} className="flex-1 h-1.5 rounded-full cursor-pointer" style={{ backgroundColor: "var(--color-surface-2)" }}>
                                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: "var(--color-brand)" }} />
                            </div>
                            <span className="text-xs w-9 shrink-0" style={{ color: "var(--color-text-faint)" }}>
                                {formatTime(duration)}
                            </span>
                        </div>

                        <div className="hidden xl:flex items-center gap-2 w-24 shrink-0">
                            {volume === 0 ? <FaVolumeMute size={13} style={{ color: "var(--color-text-faint)" }} /> : <FaVolumeUp size={13} style={{ color: "var(--color-text-faint)" }} />}
                            <div onClick={handleVolumeChange} className="flex-1 h-1.5 rounded-full cursor-pointer" style={{ backgroundColor: "var(--color-surface-2)" }}>
                                <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, backgroundColor: "var(--color-text-muted)" }} />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowQueue(!showQueue)}
                            title="Up Next"
                            className="shrink-0 relative"
                            style={{ color: showQueue ? "var(--color-brand)" : "var(--color-text-faint)" }}
                        >
                            <FaListUl size={14} />
                            {upNext.length > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-1.5 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                                >
                                    {upNext.length > 9 ? "9+" : upNext.length}
                                </span>
                            )}
                        </button>

                        <button onClick={closePlayer} className="shrink-0" style={{ color: "var(--color-text-faint)" }} title="Close player">
                            <FaTimes size={13} />
                        </button>

                    </div>

                    {/* Mobile-only progress line — desktop already shows
                        this inline within the controls row above (md:) */}
                    <div className="flex md:hidden items-center gap-2 px-4 pb-2.5 -mt-1">
                        <span className="text-[10px] w-8 text-right shrink-0" style={{ color: "var(--color-text-faint)" }}>
                            {formatTime(progress)}
                        </span>
                        <div onClick={handleSeek} className="flex-1 h-1 rounded-full cursor-pointer" style={{ backgroundColor: "var(--color-surface-2)" }}>
                            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: "var(--color-brand)" }} />
                        </div>
                        <span className="text-[10px] w-8 shrink-0" style={{ color: "var(--color-text-faint)" }}>
                            {formatTime(duration)}
                        </span>
                    </div>

                </>

            )}

            {showRingtoneTrimmer && (
                <RingtoneTrimmerModal track={currentTrack} onClose={() => setShowRingtoneTrimmer(false)} />
            )}

        </div>
    );
}

export default MusicPlayerBar;
