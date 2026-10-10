import { useContext, useEffect, useState } from "react";
import {
    FaUsers, FaVideo, FaEye, FaThumbsUp, FaSync, FaTrash, FaShieldAlt, FaEnvelope, FaCheck,
} from "react-icons/fa";
import {
    getAdminOverview,
    getAllUsersAdmin,
    setUserRoleAdmin,
    deleteUserAdmin,
    getAllVideosAdmin,
    deleteVideoAdmin,
    getSyncChannelsAdmin,
    addSyncChannelAdmin,
    toggleSyncChannelAdmin,
    removeSyncChannelAdmin,
    triggerSyncAdmin,
    getContactMessagesAdmin,
    resolveContactMessageAdmin,
} from "../api/adminApi";
import { LanguageContext } from "../context/LanguageContext";

const TABS = ["Overview", "Videos", "Users", "Auto-Fetch", "Support"];

function AdminDashboard() {

    const { t } = useContext(LanguageContext);
    const [tab, setTab] = useState("Overview");
    const [overview, setOverview] = useState(null);
    const [videos, setVideos] = useState([]);
    const [users, setUsers] = useState([]);
    const [channels, setChannels] = useState([]);
    const [contactMessages, setContactMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [newChannel, setNewChannel] = useState({ channelId: "", label: "", fallbackCategory: "General" });

    useEffect(() => {
        loadForTab(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const loadForTab = async (activeTab) => {
        try {
            setLoading(true);

            if (activeTab === "Overview") {
                const res = await getAdminOverview();
                setOverview(res.data);
            } else if (activeTab === "Videos") {
                const res = await getAllVideosAdmin();
                setVideos(res.data.videos);
            } else if (activeTab === "Users") {
                const res = await getAllUsersAdmin();
                setUsers(res.data.users);
            } else if (activeTab === "Auto-Fetch") {
                const res = await getSyncChannelsAdmin();
                setChannels(res.data.channels);
            } else if (activeTab === "Support") {
                const res = await getContactMessagesAdmin();
                setContactMessages(res.data.messages);
            }

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVideo = async (id) => {
        if (!confirm("Delete this video permanently?")) return;
        try {
            await deleteVideoAdmin(id);
            setVideos((prev) => prev.filter((v) => v._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete");
        }
    };

    const handleRoleToggle = async (user) => {
        const nextRole = user.role === "admin" ? "user" : "admin";
        try {
            await setUserRoleAdmin(user._id, nextRole);
            setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: nextRole } : u)));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Delete this user permanently?")) return;
        try {
            await deleteUserAdmin(id);
            setUsers((prev) => prev.filter((u) => u._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete");
        }
    };

    const handleAddChannel = async () => {
        if (!newChannel.channelId.trim()) return;
        try {
            const res = await addSyncChannelAdmin(newChannel);
            setChannels((prev) => [res.data.channel, ...prev]);
            setNewChannel({ channelId: "", label: "", fallbackCategory: "General" });
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add channel");
        }
    };

    const handleToggleChannel = async (id) => {
        try {
            const res = await toggleSyncChannelAdmin(id);
            setChannels((prev) => prev.map((c) => (c._id === id ? res.data.channel : c)));
        } catch (error) {
            alert(error.response?.data?.message || "Failed");
        }
    };

    const handleRemoveChannel = async (id) => {
        try {
            await removeSyncChannelAdmin(id);
            setChannels((prev) => prev.filter((c) => c._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || "Failed");
        }
    };

    const handleResolveMessage = async (id) => {
        try {
            const res = await resolveContactMessageAdmin(id);
            setContactMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status: res.data.message } : m)));
        } catch (error) {
            alert(error.response?.data?.message || "Failed");
        }
    };

    const handleTriggerSync = async () => {
        try {
            setSyncing(true);
            const res = await triggerSyncAdmin();
            alert(`Sync complete: ${res.data.created} added, ${res.data.skipped} already existed.`);
        } catch (error) {
            alert(error.response?.data?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const cardStyle = {
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
    };

    return (
        <div>

            <div className="flex items-center gap-3 mb-6">
                <FaShieldAlt style={{ color: "var(--color-brand)" }} size={24} />
                <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("nav_admin")} Dashboard
                </h1>
            </div>

            {/* Tabs */}
            <div
                className="flex rounded-full p-1 mb-6 w-fit border"
                style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
            >
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-full text-sm transition-all ${tab === t ? "brand-btn" : ""}`}
                        style={tab !== t ? { color: "var(--color-text-muted)" } : {}}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
            ) : (
                <>

                    {/* ================= OVERVIEW ================= */}
                    {tab === "Overview" && overview && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Users", value: overview.userCount, icon: <FaUsers /> },
                                { label: "Videos", value: overview.videoCount, icon: <FaVideo /> },
                                { label: "Total Views", value: overview.totalViews, icon: <FaEye /> },
                                { label: "Total Likes", value: overview.totalLikes, icon: <FaThumbsUp /> },
                            ].map((card) => (
                                <div key={card.label} className="rounded-xl p-6 border" style={cardStyle}>
                                    <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-brand)" }}>
                                        {card.icon}
                                        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{card.label}</span>
                                    </div>
                                    <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>{card.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ================= VIDEOS ================= */}
                    {tab === "Videos" && (
                        <div className="space-y-3">
                            {videos.map((video) => (
                                <div
                                    key={video._id}
                                    className="flex items-center gap-4 p-3 rounded-xl border"
                                    style={cardStyle}
                                >
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-lg shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate" style={{ color: "var(--color-text)" }}>{video.title}</p>
                                        <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                                            {video.channel} · {video.category} · {video.views} views · uploaded by {video.user?.name || "unknown"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteVideo(video._id)}
                                        className="text-red-400 hover:text-red-300 px-3 py-2"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ================= USERS ================= */}
                    {tab === "Users" && (
                        <div className="space-y-3">
                            {users.map((u) => (
                                <div
                                    key={u._id}
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border"
                                    style={cardStyle}
                                >
                                    <div>
                                        <p className="font-medium" style={{ color: "var(--color-text)" }}>{u.name}</p>
                                        <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-xs px-2.5 py-1 rounded-full"
                                            style={{
                                                backgroundColor: u.role === "admin" ? "var(--color-brand-soft)" : "var(--color-surface-2)",
                                                color: u.role === "admin" ? "var(--color-brand)" : "var(--color-text-muted)",
                                            }}
                                        >
                                            {u.role}
                                        </span>
                                        <button
                                            onClick={() => handleRoleToggle(u)}
                                            className="text-xs px-3 py-1.5 rounded-full border"
                                            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                                        >
                                            Make {u.role === "admin" ? "User" : "Admin"}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u._id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ================= AUTO-FETCH (SYNC CHANNELS) ================= */}
                    {tab === "Auto-Fetch" && (
                        <div>

                            <div className="flex items-center justify-between mb-4">
                                <p style={{ color: "var(--color-text-muted)" }}>
                                    Channels the AI auto-sync pulls new videos from (via public YouTube RSS, no API key).
                                </p>
                                <button
                                    onClick={handleTriggerSync}
                                    disabled={syncing}
                                    className="ai-btn px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <FaSync className={syncing ? "animate-spin" : ""} />
                                    {syncing ? "Syncing..." : "Sync Now"}
                                </button>
                            </div>

                            <div className="ai-panel rounded-lg p-4 mb-6 flex flex-wrap gap-2">
                                <input
                                    type="text"
                                    placeholder="Channel ID (UCxxxxxxxx...)"
                                    value={newChannel.channelId}
                                    onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                                    className="flex-1 min-w-[200px] p-2 rounded-lg text-sm outline-none"
                                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                                />
                                <input
                                    type="text"
                                    placeholder="Label (optional)"
                                    value={newChannel.label}
                                    onChange={(e) => setNewChannel({ ...newChannel, label: e.target.value })}
                                    className="w-40 p-2 rounded-lg text-sm outline-none"
                                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                                />
                                <select
                                    value={newChannel.fallbackCategory}
                                    onChange={(e) => setNewChannel({ ...newChannel, fallbackCategory: e.target.value })}
                                    className="p-2 rounded-lg text-sm outline-none"
                                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                                >
                                    <option>Education</option>
                                    <option>Programming</option>
                                    <option>Gaming</option>
                                    <option>Music</option>
                                    <option>Technology</option>
                                    <option>Entertainment</option>
                                    <option>Sports</option>
                                    <option>General</option>
                                </select>
                                <button onClick={handleAddChannel} className="ai-btn px-4 py-2 rounded-lg text-sm">
                                    Add Channel
                                </button>
                            </div>

                            <div className="space-y-3">
                                {channels.map((c) => (
                                    <div
                                        key={c._id}
                                        className="flex items-center justify-between p-4 rounded-xl border"
                                        style={cardStyle}
                                    >
                                        <div>
                                            <p className="font-medium" style={{ color: "var(--color-text)" }}>
                                                {c.label || c.channelId}
                                            </p>
                                            <p className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>
                                                {c.channelId} · fallback: {c.fallbackCategory}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleChannel(c._id)}
                                                className="text-xs px-3 py-1.5 rounded-full border"
                                                style={{
                                                    borderColor: "var(--color-border)",
                                                    color: c.active ? "#5eead4" : "var(--color-text-faint)",
                                                }}
                                            >
                                                {c.active ? "Active" : "Paused"}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveChannel(c._id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}

                    {/* ================= SUPPORT ================= */}
                    {tab === "Support" && (
                        <div className="space-y-3">
                            {contactMessages.length === 0 ? (
                                <p style={{ color: "var(--color-text-muted)" }}>No support messages yet.</p>
                            ) : (
                                contactMessages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className="p-4 rounded-xl border"
                                        style={cardStyle}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                                                    {msg.subject}
                                                </p>
                                                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                                                    {msg.name} · {msg.email} · {new Date(msg.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <span
                                                className="text-xs px-2.5 py-1 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor: msg.status === "resolved" ? "var(--color-surface-2)" : "var(--color-brand-soft)",
                                                    color: msg.status === "resolved" ? "var(--color-text-faint)" : "var(--color-brand)",
                                                }}
                                            >
                                                {msg.status}
                                            </span>
                                        </div>

                                        <p className="text-sm mt-3 whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
                                            {msg.message}
                                        </p>

                                        <div className="flex items-center gap-3 mt-3">
                                            <a
                                                href={`mailto:${msg.email}`}
                                                className="text-xs flex items-center gap-1"
                                                style={{ color: "var(--color-brand)" }}
                                            >
                                                <FaEnvelope size={10} />
                                                Reply by email
                                            </a>
                                            <button
                                                onClick={() => handleResolveMessage(msg._id)}
                                                className="text-xs flex items-center gap-1"
                                                style={{ color: "#5eead4" }}
                                            >
                                                <FaCheck size={10} />
                                                Mark as {msg.status === "resolved" ? "open" : "resolved"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </>
            )}

        </div>
    );
}

export default AdminDashboard;
