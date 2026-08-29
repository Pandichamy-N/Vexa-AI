import { useContext, useState } from "react";
import { FaPlay, FaPause, FaDownload, FaCut } from "react-icons/fa";
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { getDownloadUrl } from "../utils/cloudinaryDownload";
import RingtoneTrimmerModal from "./RingtoneTrimmerModal";

function MusicCard({ track, queue = [], isPremium = false, source = "list" }) {

    const { currentTrack, isPlaying, playTrack, togglePlay } = useContext(MusicPlayerContext);
    const [showRingtoneTrimmer, setShowRingtoneTrimmer] = useState(false);

    const isCurrent = currentTrack?._id === track._id;

    // Download/ringtone only ever offered when BOTH are true: the
    // track's own license allows it (downloadAllowed — never assumed,
    // always read from the provider), AND the person is Premium. Free
    // users get streaming + ads only, per the plan.
    const canDownload = track.downloadAllowed && isPremium;

    const handleClick = () => {
        if (isCurrent) {
            togglePlay();
        } else {
            playTrack(track, queue.length ? queue : [track], isPremium, source);
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        const url = getDownloadUrl(track.downloadUrl, `${track.artist} - ${track.title}`);
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleOpenRingtoneTrimmer = (e) => {
        e.stopPropagation();
        setShowRingtoneTrimmer(true);
    };

    return (
        <div
            onClick={handleClick}
            className="group media-card rounded-2xl overflow-hidden cursor-pointer border"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: isCurrent ? "var(--color-brand)" : "var(--color-border-soft)",
                borderWidth: isCurrent ? "2px" : "1px",
            }}
        >

            <div className="relative overflow-hidden">

                <img
                    src={track.cover}
                    alt={track.title}
                    className="w-full aspect-square object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                />

                {isCurrent && isPlaying && (
                    <span
                        className="absolute bottom-2 left-2 flex items-center justify-center w-7 h-7 rounded-full"
                        style={{ backgroundColor: "rgba(18,18,18,0.75)" }}
                    >
                        <span className="now-playing-eq">
                            <span></span><span></span><span></span>
                        </span>
                    </span>
                )}

                <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                    style={{
                        background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)",
                        opacity: isCurrent ? 1 : 0,
                    }}
                >
                    <span
                        className="w-11 h-11 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200"
                        style={{
                            backgroundColor: "var(--color-brand)",
                            color: "#ffffff",
                            opacity: isCurrent ? 1 : undefined,
                        }}
                    >
                        {isCurrent && isPlaying ? (
                            <FaPause size={13} />
                        ) : (
                            <FaPlay size={13} style={{ marginLeft: "2px" }} />
                        )}
                    </span>
                </div>

                {!isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
                    >
                        <span
                            className="w-11 h-11 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200"
                            style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                        >
                            <FaPlay size={13} style={{ marginLeft: "2px" }} />
                        </span>
                    </div>
                )}

                {track.source === "youtube" && (
                    <span
                        className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "rgba(18,18,18,0.75)", color: "var(--color-text-muted)" }}
                        title="Streamed from YouTube — download not available"
                    >
                        YT
                    </span>
                )}

                {canDownload && (
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={handleDownload}
                            title="Download"
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(18,18,18,0.75)", color: "var(--color-text)" }}
                        >
                            <FaDownload size={10} />
                        </button>
                        <button
                            onClick={handleOpenRingtoneTrimmer}
                            title="Trim a ringtone"
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(18,18,18,0.75)", color: "var(--color-text)" }}
                        >
                            <FaCut size={10} />
                        </button>
                    </div>
                )}

            </div>

            <div className="p-2 sm:p-3">
                <h3
                    className="font-semibold text-xs sm:text-sm line-clamp-1"
                    style={{ color: isCurrent ? "var(--color-brand)" : "var(--color-text)" }}
                >
                    {track.title}
                </h3>
                <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {track.artist}
                </p>
            </div>

            {showRingtoneTrimmer && (
                <div onClick={(e) => e.stopPropagation()}>
                    <RingtoneTrimmerModal track={track} onClose={() => setShowRingtoneTrimmer(false)} />
                </div>
            )}

        </div>
    );
}

export default MusicCard;
