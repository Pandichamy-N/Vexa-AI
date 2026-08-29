import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaHeart,
    FaRegHeart,
    FaComment,
    FaShare,
    FaVolumeMute,
    FaVolumeUp,
    FaTimes,
    FaPlay,
    FaSyncAlt,
} from "react-icons/fa";
import { getShorts, likeVideo, addComment, increaseView, autoFetchShorts } from "../api/videoApi";
import { getProfile } from "../services/userService";
import { LanguageContext } from "../context/LanguageContext";

// ================= ONE SHORT =================
function ShortCard({ short, isActive, muted, onToggleMute, onSeenView, myName }) {

    const videoRef = useRef(null);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(short.likes || 0);
    const [paused, setPaused] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(short.comments || []);
    const [commentText, setCommentText] = useState("");
    const [shareCopied, setShareCopied] = useState(false);
    const viewCounted = useRef(false);

    useEffect(() => {
        if (short.videoId) return; // YouTube iframe handles its own autoplay via the URL params

        const el = videoRef.current;
        if (!el) return;

        if (isActive) {
            el.currentTime = 0;
            el.play().catch(() => {});
            setPaused(false);

            if (!viewCounted.current) {
                viewCounted.current = true;
                onSeenView(short._id);
            }
        } else {
            el.pause();
        }
    }, [isActive]);

    // A YouTube short still needs its view counted once it becomes
    // active, even though there's no <video> element to hook onLoad into.
    useEffect(() => {
        if (!short.videoId || !isActive || viewCounted.current) return;
        viewCounted.current = true;
        onSeenView(short._id);
    }, [isActive]);

    const togglePlayPause = () => {
        if (short.videoId) return; // no play/pause control on the embed
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) {
            el.play().catch(() => {});
            setPaused(false);
        } else {
            el.pause();
            setPaused(true);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            const res = await likeVideo(short._id);
            setLikes(res.data.likes);
            setLiked(true);
        } catch (error) {
            console.log(error);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await addComment(short._id, {
                username: myName || "Guest",
                text: commentText,
            });
            setComments(res.data.comments);
            setCommentText("");
        } catch (error) {
            if (error.response?.data?.blocked) {
                alert(error.response.data.message);
            } else {
                alert(error.response?.data?.message || "Failed to post comment");
            }
        }
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/video/${short._id}`;
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 1500);
        } catch {
            // Clipboard blocked — nothing to fall back to gracefully here.
        }
    };

    return (
        <div className="relative w-full h-full snap-start shrink-0 flex items-center justify-center">

            <div
                className="relative w-full h-full sm:w-[400px] sm:h-full sm:rounded-2xl overflow-hidden"
                style={{ backgroundColor: "#000" }}
                onClick={togglePlayPause}
            >
                {short.videoId ? (
                    // YouTube-sourced short (auto-fetched or AI-imported) —
                    // can't play in a plain <video> tag, needs the embed
                    // player. Only mounted while active so inactive cards
                    // in the feed don't all autoplay/download at once.
                    isActive ? (
                        <iframe
                            key={`${short._id}-${muted}`}
                            src={`https://www.youtube.com/embed/${short.videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${short.videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                            className="w-full h-full pointer-events-none"
                            allow="autoplay; encrypted-media"
                            title={short.title}
                        />
                    ) : (
                        <img
                            src={short.thumbnail}
                            alt={short.title}
                            className="w-full h-full object-cover"
                        />
                    )
                ) : (
                    <video
                        ref={videoRef}
                        src={short.videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted={muted}
                        playsInline
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={handleLike}
                        onClickCapture={togglePlayPause}
                    />
                )}

                {paused && !short.videoId && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <FaPlay size={44} color="rgba(255,255,255,0.85)" />
                    </div>
                )}

                {/* Bottom info */}
                <div
                    className="absolute bottom-0 left-0 right-16 p-4 pb-6"
                    style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75), transparent)" }}
                >
                    <p className="text-white font-semibold text-sm mb-1">
                        @{short.channel}
                    </p>
                    <p className="text-white/90 text-sm line-clamp-2">
                        {short.title}
                    </p>
                </div>

                {/* Mute toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                >
                    {muted ? <FaVolumeMute color="#fff" size={15} /> : <FaVolumeUp color="#fff" size={15} />}
                </button>

                {/* Right action rail */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
                    <button
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1"
                    >
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                        >
                            {liked ? (
                                <FaHeart color="#ff3b5c" size={18} />
                            ) : (
                                <FaRegHeart color="#fff" size={18} />
                            )}
                        </div>
                        <span className="text-white text-xs font-medium">{likes}</span>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                        className="flex flex-col items-center gap-1"
                    >
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                        >
                            <FaComment color="#fff" size={17} />
                        </div>
                        <span className="text-white text-xs font-medium">{comments.length}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1"
                    >
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                        >
                            <FaShare color="#fff" size={16} />
                        </div>
                        <span className="text-white text-xs font-medium">
                            {shareCopied ? "Copied!" : "Share"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Comments sheet */}
            {showComments && (
                <div
                    className="absolute inset-0 flex items-end sm:items-center sm:justify-center z-10"
                    onClick={(e) => { e.stopPropagation(); setShowComments(false); }}
                >
                    <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />

                    <div
                        className="relative w-full sm:w-[400px] max-h-[70%] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
                        style={{ backgroundColor: "var(--color-surface)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: "1px solid var(--color-border-soft)" }}
                        >
                            <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                                {comments.length} comments
                            </p>
                            <button onClick={() => setShowComments(false)}>
                                <FaTimes style={{ color: "var(--color-text-muted)" }} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {comments.length === 0 && (
                                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-faint)" }}>
                                    No comments yet. Say something!
                                </p>
                            )}
                            {comments.map((c, i) => (
                                <div key={i} className="py-2" style={{ borderBottom: "1px solid var(--color-border-soft)" }}>
                                    <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                                        {c.username}
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                        {c.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div
                            className="flex items-center gap-2 p-3"
                            style={{ borderTop: "1px solid var(--color-border-soft)" }}
                        >
                            <input
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                                placeholder="Add a comment..."
                                className="flex-1 px-3 py-2 rounded-full text-sm outline-none"
                                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                            />
                            <button
                                onClick={handleComment}
                                className="px-4 py-2 rounded-full text-sm font-medium"
                                style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ================= FEED =================
function Shorts() {

    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const [shorts, setShorts] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [muted, setMuted] = useState(true);
    const [loading, setLoading] = useState(true);
    const [myName, setMyName] = useState("Guest");
    const [fetching, setFetching] = useState(false);
    const containerRef = useRef(null);
    const seenIds = useRef(new Set());

    useEffect(() => {
        loadInitial();
        getProfile().then((res) => setMyName(res.user?.name || "Guest")).catch(() => {});
    }, []);

    const loadInitial = async () => {
        try {
            setLoading(true);
            const res = await getShorts();
            setShorts(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = useCallback(async () => {
        try {
            const lastId = shorts[shorts.length - 1]?._id;
            const res = await getShorts(lastId);
            // Avoid appending duplicates the random sample might repeat.
            const existingIds = new Set(shorts.map((s) => s._id));
            const fresh = res.data.filter((s) => !existingIds.has(s._id));
            setShorts((prev) => [...prev, ...fresh]);
        } catch (error) {
            console.log(error);
        }
    }, [shorts]);

    const handleSeenView = (id) => {
        if (seenIds.current.has(id)) return;
        seenIds.current.add(id);
        increaseView(id).catch(() => {});
    };

    // Track which short is centered in view, and top up the feed as the
    // person nears the end of what's loaded.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const cards = container.querySelectorAll("[data-short-index]");
        if (!cards.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                        const idx = Number(entry.target.getAttribute("data-short-index"));
                        setActiveIndex(idx);
                        if (idx >= shorts.length - 3) {
                            loadMore();
                        }
                    }
                });
            },
            { root: container, threshold: [0.6] }
        );

        cards.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
    }, [shorts.length, loadMore]);

    const handleFetchFromYoutube = async () => {
        try {
            setFetching(true);
            const res = await autoFetchShorts();
            if (res.data.created === 0) {
                alert("No new Shorts found right now — try again in a bit, or add YOUTUBE_API_KEY to the server .env if this keeps happening.");
            }
            await loadInitial();
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Couldn't fetch Shorts from YouTube.");
        } finally {
            setFetching(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]" style={{ color: "var(--color-text-muted)" }}>
                Loading Shorts...
            </div>
        );
    }

    if (!shorts.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-3" style={{ color: "var(--color-text-muted)" }}>
                <p>No Shorts yet.</p>
                <p className="text-sm text-center max-w-xs" style={{ color: "var(--color-text-faint)" }}>
                    Upload a vertical video and check "Post as a Short", or pull some in from YouTube.
                </p>
                <button
                    onClick={handleFetchFromYoutube}
                    disabled={fetching}
                    className="mt-2 px-5 py-2.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                >
                    {fetching ? "Fetching..." : "⚡ Fetch Shorts from YouTube"}
                </button>
            </div>
        );
    }

    return (
        <div className="relative -m-3 sm:-m-4 md:-m-6 h-[calc(100vh-64px)] overflow-hidden" style={{ backgroundColor: "#000" }}>

            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
                <FaTimes color="#fff" size={16} />
            </button>

            <button
                onClick={handleFetchFromYoutube}
                disabled={fetching}
                title="Fetch more Shorts from YouTube"
                className="absolute top-4 left-16 z-20 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
                <FaSyncAlt color="#fff" size={13} className={fetching ? "animate-spin" : ""} />
            </button>

            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollbarWidth: "none" }}
            >
                {shorts.map((short, idx) => (
                    <div key={short._id} data-short-index={idx} className="h-full w-full snap-start">
                        <ShortCard
                            short={short}
                            isActive={idx === activeIndex}
                            muted={muted}
                            onToggleMute={() => setMuted((m) => !m)}
                            onSeenView={handleSeenView}
                            myName={myName}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Shorts;
