import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API_ROOT } from "../config/api";
import { FaThumbsUp, FaRobot, FaHeart, FaRegHeart, FaShareAlt, FaCheck } from "react-icons/fa";
import RelatedVideos from "../components/RelatedVideos";
import {
    likeVideo,
    addComment,
    addToWatchLater,
    addToHistory,
    increaseView,
} from "../api/videoApi";
import {
    subscribeToChannel,
    unsubscribeFromChannel,
    checkSubscription,
    toggleFavorite,
    checkFavorite,
} from "../services/userService";
import {
    getMyPlaylists,
    addVideoToPlaylist,
} from "../services/playlistService";
import { getVideoSummary, askAboutVideo } from "../api/aiApi";
import { LanguageContext } from "../context/LanguageContext";

function VideoPage() {

    const { t } = useContext(LanguageContext);
    const { id } = useParams();
    const currentUserId = localStorage.getItem("userId");

    const [video, setVideo] = useState(null);
    const [likes, setLikes] = useState(0);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);

    const [subscriberCount, setSubscriberCount] = useState(0);
    const [subscribed, setSubscribed] = useState(false);

    const [favorited, setFavorited] = useState(false);

    const [playlists, setPlaylists] = useState([]);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // ================= AI SUMMARY STATE =================
    const [aiSummary, setAiSummary] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [showAiSummary, setShowAiSummary] = useState(false);

    // ================= AI Q&A CHAT STATE =================
    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [askLoading, setAskLoading] = useState(false);


    useEffect(() => {
        fetchVideo();
        // Reset AI panels when navigating between videos
        setAiSummary(null);
        setShowAiSummary(false);
        setChatHistory([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        try {
            const data = await getMyPlaylists();
            setPlaylists(data.playlists);
        } catch (err) {
            console.log(err);
        }
    };

    // ================= FETCH VIDEO =================
    const fetchVideo = async () => {
        try {

            const res = await axios.get(
                `${API_ROOT}/api/videos/${id}`
            );

            setVideo(res.data);
            setLikes(res.data.likes || 0);
            setComments(res.data.comments || []);

            // Count this view
            increaseView(id).catch((err) => console.log(err));

            if (res.data.user) {
                setSubscriberCount(
                    res.data.user.subscribers?.length || 0
                );

                const token = localStorage.getItem("token");

                if (token) {
                    const result = await checkSubscription(
                        res.data.user._id
                    );

                    setSubscribed(result.subscribed);
                }
            }

            const token = localStorage.getItem("token");

            if (token) {
                await addToHistory(res.data._id, token);

                try {
                    const favResult = await checkFavorite(res.data._id);
                    setFavorited(favResult.favorited);
                } catch (favError) {
                    console.log(favError);
                }
            }

        } catch (error) {

            console.log(error);

        }
    };

    // ================= LOADING =================
    if (!video) {
        return (
            <div className="text-[var(--color-text)] text-2xl p-10">
                Loading...
            </div>
        );
    }

    // ================= LIKE =================
    const handleLike = async () => {
        try {

            const res = await likeVideo(video._id);

            setLikes(res.data.likes);

        } catch (error) {

            console.log(error);

        }
    };

    // ================= WATCH LATER =================
    const handleWatchLater = async () => {

        try {

            const token = localStorage.getItem("token");

            const res = await addToWatchLater(
                video._id,
                token
            );

            alert(res.data.message);

        } catch (error) {

            console.log(error.response);

            alert(
                error.response?.data?.message ||
                "Failed"
            );

        }

    };
    const handleSubscribe = async () => {
        try {

            if (!video.user) {
                alert("Channel information not found.");
                return;
            }

            await subscribeToChannel(video.user._id);

            setSubscribed(true);
            setSubscriberCount((prev) => prev + 1);

        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Couldn't subscribe. Try again.");
        }
    };
    const handleUnsubscribe = async () => {
        try {

            await unsubscribeFromChannel(video.user._id);

            setSubscribed(false);

            setSubscriberCount((prev) => prev - 1);

        } catch (error) {

            console.log(error);
            alert(error.response?.data?.message || "Couldn't unsubscribe. Try again.");

        }
    };

    // ================= COMMENT (AI-moderated on the backend) =================
    const handleComment = async () => {

        if (!comment.trim()) return;

        try {

            const res = await addComment(video._id, {
                username: "Pandichamy",
                text: comment,
            });

            setComments(res.data.comments);

            setComment("");

        } catch (error) {

            console.log(error);

            // The backend returns a friendly message when AI moderation
            // blocks a comment (400 + blocked: true).
            if (error.response?.data?.blocked) {
                alert(error.response.data.message);
            } else {
                alert(
                    error.response?.data?.message ||
                    "Failed to post comment"
                );
            }

        }

    };
    // ================= SHARE =================
    const handleShare = async () => {

        const url = `${window.location.origin}/video/${video._id}`;

        try {

            if (navigator.share) {
                // Native share sheet on mobile/supported browsers
                await navigator.share({ title: video.title, url });
                return;
            }

            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);

        } catch (error) {
            console.log(error);
        }

    };

    const handleSaveToPlaylist = async (playlistId) => {

        try {

            await addVideoToPlaylist(
                playlistId,
                video._id
            );

            alert("✅ Video Added Successfully");

            setShowPlaylist(false);

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Something went wrong"
            );

        }

    };

    // ================= FAVORITE =================
    const handleToggleFavorite = async () => {

        try {

            const result = await toggleFavorite(video._id);

            setFavorited(result.favorited);

        } catch (error) {

            console.log(error);
            alert(error.response?.data?.message || "Couldn't update favorites. Try again.");

        }

    };

    // ================= AI SUMMARY =================
    const handleGenerateSummary = async (force = false) => {

        setShowAiSummary(true);

        if (aiSummary && !force) return;

        try {

            setAiLoading(true);
            setAiError("");

            const data = await getVideoSummary(video._id, force);

            setAiSummary(data);

        } catch (error) {

            console.log(error);

            setAiError(
                error.response?.data?.message ||
                "Couldn't generate an AI summary right now."
            );

        } finally {

            setAiLoading(false);

        }

    };

    // ================= AI Q&A CHAT =================
    const handleAskQuestion = async () => {

        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion("");

        setChatHistory((prev) => [
            ...prev,
            { question: currentQuestion, answer: null },
        ]);

        try {

            setAskLoading(true);

            const data = await askAboutVideo(video._id, currentQuestion);

            setChatHistory((prev) =>
                prev.map((item, idx) =>
                    idx === prev.length - 1
                        ? { ...item, answer: data.answer }
                        : item
                )
            );

        } catch (error) {

            console.log(error);

            setChatHistory((prev) =>
                prev.map((item, idx) =>
                    idx === prev.length - 1
                        ? {
                            ...item,
                            answer:
                                error.response?.data?.message ||
                                "Sorry, I couldn't answer that.",
                        }
                        : item
                )
            );

        } finally {

            setAskLoading(false);

        }

    };


    // ================= UI =================
    return (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 text-[var(--color-text)]">

            {/* LEFT */}
            <div className="lg:col-span-8">

                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">

                    {video.videoId ? (

                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>

                    ) : (

                        <video
                            src={video.videoUrl}
                            controls
                            className="w-full h-full"
                        />

                    )}

                </div>

                <div className="mt-5">

                    <h1 className="text-3xl font-bold">
                        {video.title}
                    </h1>

                    <div className="flex items-center justify-between mt-3">

                        <div>

                            <Link
                                to={`/channel/${video.user?._id}`}
                                className="text-lg font-semibold transition" style={{ color: "var(--color-text)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-brand)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text)"}
                            >
                                {video.channel}
                            </Link>

                            <p className="text-[var(--color-text-muted)] text-sm">
                                {subscriberCount} Subscribers
                            </p>

                        </div>

                        {subscribed ? (

                            <button
                                onClick={handleUnsubscribe}
                                className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full"
                            >
                                ✓ {t("subscribed")}
                            </button>

                        ) : (

                            <button
                                onClick={handleSubscribe}
                                className="brand-btn px-5 py-2 rounded-full"
                            >
                                {t("subscribe")}
                            </button>

                        )}

                    </div>

                    <div className="flex gap-4 mt-4">

                        <span>{video.views} views</span>

                        <span>{video.time}</span>

                    </div>

                    {video.description && (
                        <p className="text-[var(--color-text-muted)] mt-4 whitespace-pre-line">
                            {video.description}
                        </p>
                    )}

                    <div className="flex gap-3 mt-5 flex-wrap">

                        <button
                            onClick={handleLike}
                            className="flex items-center gap-2 bg-[var(--color-surface-2)] hover:brightness-125 px-5 py-2 rounded-lg" style={{ color: "var(--color-text)" }}
                        >
                            <FaThumbsUp />
                            {likes} {t("like")}
                        </button>

                        <button
                            onClick={handleToggleFavorite}
                            className="flex items-center gap-2 bg-[var(--color-surface-2)] hover:brightness-125 px-5 py-2 rounded-lg"
                            style={{ color: favorited ? "#f87171" : "var(--color-text)" }}
                        >
                            {favorited ? <FaHeart /> : <FaRegHeart />}
                            {favorited ? t("favorited") : t("favorite")}
                        </button>

                        <button
                            onClick={handleWatchLater}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
                        >
                            🔖 {t("watch_later")}
                        </button>
                        <button
                            onClick={() =>
                                setShowPlaylist(!showPlaylist)
                            }
                            className="brand-btn px-5 py-2 rounded-lg"
                        >
                            💾 {t("save")}
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-[var(--color-surface-2)] hover:brightness-125 px-5 py-2 rounded-lg"
                            style={{ color: linkCopied ? "#5eead4" : "var(--color-text)" }}
                        >
                            {linkCopied ? <FaCheck /> : <FaShareAlt />}
                            {linkCopied ? t("link_copied") : t("share")}
                        </button>

                        <button
                            onClick={() => handleGenerateSummary(false)}
                            className="ai-btn px-5 py-2 rounded-lg"
                        >
                            <FaRobot />
                            {t("ai_summary")}
                        </button>

                        {
                            showPlaylist && (

                                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 mt-4 w-80">

                                    <h2 className="text-xl font-bold mb-4">
                                        Save to Playlist
                                    </h2>

                                    {
                                        playlists.length === 0 ? (

                                            <p className="text-[var(--color-text-muted)]">
                                                No Playlists Found
                                            </p>

                                        ) : (

                                            playlists.map((playlist) => (

                                                <button
                                                    key={playlist._id}
                                                    onClick={() =>
                                                        handleSaveToPlaylist(
                                                            playlist._id
                                                        )
                                                    }
                                                    className="w-full text-left hover:bg-[var(--color-surface-2)] rounded-lg p-3 mb-2"
                                                >

                                                    📂 {playlist.name}

                                                </button>

                                            ))

                                        )
                                    }

                                </div>

                            )
                        }

                    </div>

                    {/* ================= AI SUMMARY PANEL ================= */}
                    {showAiSummary && (

                        <div className="ai-panel mt-6 rounded-xl p-5 animate-fade-up">

                            <div className="flex items-center justify-between">

                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaRobot style={{ color: "#5eead4" }} />
                                    {t("ai_summary")}
                                </h2>

                                {aiSummary && !aiLoading && (
                                    <button
                                        onClick={() => handleGenerateSummary(true)}
                                        className="text-sm" style={{ color: "#5eead4" }}
                                    >
                                        Regenerate
                                    </button>
                                )}

                            </div>

                            {aiLoading && (
                                <p className="text-[var(--color-text-muted)] mt-3">
                                    Generating summary...
                                </p>
                            )}

                            {aiError && !aiLoading && (
                                <p className="text-red-400 mt-3">{aiError}</p>
                            )}

                            {aiSummary && !aiLoading && !aiError && (

                                <div className="mt-3 space-y-4">

                                    {aiSummary.difficulty && (
                                        <span className="inline-block bg-teal-900/40 text-teal-200 text-xs px-3 py-1 rounded-full">
                                            {aiSummary.difficulty}
                                        </span>
                                    )}

                                    {aiSummary.summary?.length > 0 && (
                                        <ul className="list-disc list-inside space-y-1 text-gray-200">
                                            {aiSummary.summary.map((point, i) => (
                                                <li key={i}>{point}</li>
                                            ))}
                                        </ul>
                                    )}

                                    {aiSummary.keyConcepts?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-[var(--color-text-muted)] mb-1">
                                                Key Concepts
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSummary.keyConcepts.map((c, i) => (
                                                    <span
                                                        key={i}
                                                        className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-xs px-3 py-1 rounded-full"
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiSummary.tags?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-[var(--color-text-muted)] mb-1">
                                                Tags
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSummary.tags.map((t, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-teal-300 text-xs"
                                                    >
                                                        #{t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>

                            )}

                            {/* ================= AI Q&A CHAT ================= */}
                            <div className="mt-6 border-t border-zinc-800 pt-4">

                                <h3 className="font-semibold text-gray-200 mb-3">
                                    Ask AI about this video
                                </h3>

                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">

                                    {chatHistory.map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <p className="text-sm font-medium" style={{ color: "#5eead4" }}>
                                                You: {item.question}
                                            </p>
                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                {item.answer === null
                                                    ? "Thinking..."
                                                    : item.answer}
                                            </p>
                                        </div>
                                    ))}

                                </div>

                                <div className="flex gap-2 mt-3">

                                    <input
                                        type="text"
                                        placeholder={t("ask_ai_placeholder")}
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAskQuestion();
                                        }}
                                        className="flex-1 bg-[var(--color-surface-2)] p-3 rounded-lg outline-none text-sm"
                                    />

                                    <button
                                        onClick={handleAskQuestion}
                                        disabled={askLoading}
                                        className="ai-btn px-5 rounded-lg text-sm"
                                    >
                                        {askLoading ? "..." : "Ask"}
                                    </button>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

                {/* COMMENTS */}

                <div className="mt-10">

                    <h2 className="text-2xl font-bold mb-4">
                        {t("comments")}
                    </h2>

                    <div className="flex gap-3">

                        <input
                            type="text"
                            placeholder={t("comment_placeholder")}
                            value={comment}
                            onChange={(e) =>
                                setComment(e.target.value)
                            }
                            className="flex-1 bg-[var(--color-surface-2)] p-3 rounded-lg outline-none"
                        />

                        <button
                            onClick={handleComment}
                            className="brand-btn px-6 rounded-lg"
                        >
                            {t("post")}
                        </button>

                    </div>

                    <p className="text-gray-500 text-xs mt-2">
                        Comments are automatically checked by AI moderation before posting.
                    </p>

                    <div className="mt-6 space-y-4">

                        {comments.map((item, index) => (

                            <div
                                key={index}
                                className="bg-[var(--color-surface)] p-4 rounded-lg animate-fade-up"
                            >

                                <h3 className="font-bold">
                                    {item.username}
                                </h3>

                                <p className="text-[var(--color-text-muted)] mt-1">
                                    {item.text}
                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

            {/* RIGHT */}

            <div className="lg:col-span-4">

                <RelatedVideos currentId={id} />

            </div>

        </div>

    );

}

export default VideoPage;
