import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaUserCircle, FaLink, FaTimes } from "react-icons/fa";
import { getChannelVideos } from "../api/videoApi";
import { subscribeToChannel, unsubscribeFromChannel, getChannelFollowers } from "../services/userService";
import { LanguageContext } from "../context/LanguageContext";

function ChannelPage() {

    const { t } = useContext(LanguageContext);
    const { userId } = useParams();

    const [videos, setVideos] = useState([]);
    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subBusy, setSubBusy] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [followersLoading, setFollowersLoading] = useState(false);

    const myUserId = localStorage.getItem("userId");

    useEffect(() => {
        fetchChannelVideos();
    }, [userId]);

    const fetchChannelVideos = async () => {
        try {
            setLoading(true);
            const res = await getChannelVideos(userId);
            setVideos(res.data.videos || []);
            setChannel(res.data.channel || null);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribeToggle = async () => {
        if (!channel) return;
        try {
            setSubBusy(true);
            if (channel.isSubscribed) {
                await unsubscribeFromChannel(channel._id);
                setChannel((c) => ({ ...c, isSubscribed: false, subscribersCount: Math.max(0, c.subscribersCount - 1) }));
            } else {
                await subscribeToChannel(channel._id);
                setChannel((c) => ({ ...c, isSubscribed: true, subscribersCount: c.subscribersCount + 1 }));
            }
        } catch (err) {
            alert(err.response?.data?.message || "Something went wrong");
        } finally {
            setSubBusy(false);
        }
    };

    const openFollowers = async () => {
        setShowFollowers(true);
        try {
            setFollowersLoading(true);
            const res = await getChannelFollowers(channel._id);
            setFollowers(res.followers || []);
        } catch (err) {
            console.log(err);
        } finally {
            setFollowersLoading(false);
        }
    };

    if (loading) {
        return <div className="text-[var(--color-text)] p-8">Loading...</div>;
    }

    if (!channel) {
        return (
            <div className="text-[var(--color-text)] p-8">
                Channel not found.
            </div>
        );
    }

    const isOwnChannel = myUserId && myUserId === channel._id;

    return (
        <div className="p-3 sm:p-4 md:p-6 text-[var(--color-text)]">

            {/* Channel Header */}
            <div className="rounded-xl p-4 sm:p-6 mb-8" style={{ backgroundColor: "var(--color-surface)" }}>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">

                    {channel.profilePic ? (
                        <img
                            src={channel.profilePic}
                            alt={channel.name}
                            className="w-20 h-20 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
                            style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                        >
                            {channel.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">
                            {channel.name}
                        </h1>

                        <button
                            onClick={openFollowers}
                            className="text-sm mt-1 hover:underline"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            {channel.subscribersCount} subscriber{channel.subscribersCount !== 1 ? "s" : ""} · {videos.length} {t("nav_myuploads_short")}
                        </button>

                        {channel.bio && (
                            <p className="text-sm mt-2 whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
                                {channel.bio}
                            </p>
                        )}

                        {channel.channelLinks?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {channel.channelLinks.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                                    >
                                        <FaLink size={10} />
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isOwnChannel && (
                        <button
                            onClick={handleSubscribeToggle}
                            disabled={subBusy}
                            className="px-5 py-2.5 rounded-full text-sm font-semibold shrink-0"
                            style={
                                channel.isSubscribed
                                    ? { backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }
                                    : { backgroundColor: "var(--color-brand)", color: "#fff" }
                            }
                        >
                            {channel.isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                    )}

                    {isOwnChannel && (
                        <Link
                            to="/profile"
                            className="px-5 py-2.5 rounded-full text-sm font-semibold shrink-0"
                            style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                        >
                            Edit channel
                        </Link>
                    )}

                </div>

            </div>

            {/* Videos */}
            {videos.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>No videos yet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                    {videos.map((video) => (

                        <Link key={video._id} to={`/video/${video._id}`}>
                            <div className="rounded-xl overflow-hidden hover:scale-105 transition" style={{ backgroundColor: "var(--color-surface)" }}>

                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-48 object-cover"
                                />

                                <div className="p-4">
                                    <h2 className="font-semibold line-clamp-2">
                                        {video.title}
                                    </h2>
                                    <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
                                        {video.views} Views • {video.time}
                                    </p>
                                </div>

                            </div>
                        </Link>

                    ))}

                </div>
            )}

            {/* Followers modal */}
            {showFollowers && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
                    onClick={() => setShowFollowers(false)}
                >
                    <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />

                    <div
                        className="relative w-full sm:w-[400px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
                        style={{ backgroundColor: "var(--color-surface)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-soft)" }}>
                            <p className="font-semibold">Subscribers</p>
                            <button onClick={() => setShowFollowers(false)}>
                                <FaTimes style={{ color: "var(--color-text-muted)" }} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {followersLoading ? (
                                <p className="p-4 text-sm text-center" style={{ color: "var(--color-text-faint)" }}>Loading...</p>
                            ) : followers.length === 0 ? (
                                <p className="p-4 text-sm text-center" style={{ color: "var(--color-text-faint)" }}>No subscribers yet.</p>
                            ) : (
                                followers.map((f) => (
                                    <Link
                                        key={f._id}
                                        to={`/channel/${f._id}`}
                                        onClick={() => setShowFollowers(false)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:brightness-125"
                                    >
                                        {f.profilePic ? (
                                            <img src={f.profilePic} alt={f.name} className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            <FaUserCircle size={36} style={{ color: "var(--color-text-faint)" }} />
                                        )}
                                        <span className="text-sm">{f.name}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ChannelPage;
