import { useContext, useEffect, useState } from "react";
import { FaUserCircle, FaPen, FaLink, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { API_ROOT } from "../config/api";
import { getProfile, uploadProfilePic, updateChannelInfo } from "../services/userService";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";

function Profile() {

    const { t } = useContext(LanguageContext);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const [editingChannel, setEditingChannel] = useState(false);
    const [bioDraft, setBioDraft] = useState("");
    const [linksDraft, setLinksDraft] = useState([]);
    const [savingChannel, setSavingChannel] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {

            setError("");

            const data = await getProfile();

            setUser(data.user);
            setBioDraft(data.user.bio || "");
            setLinksDraft(data.user.channelLinks?.length ? data.user.channelLinks : [{ label: "", url: "" }]);

        } catch (error) {

            console.log(error);

            if (error.response?.status === 401) {
                // Token expired/invalid — send back to login instead of
                // hanging on a page that can never load.
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Couldn't load your profile. Check your connection and try again."
            );

        }
    };

    if (error) {
        return (
            <div className="text-center mt-16">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                    Something went wrong
                </h2>
                <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>
                    {error}
                </p>
                <button onClick={fetchProfile} className="brand-btn px-5 py-2 rounded-lg text-sm">
                    Try Again
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-[var(--color-text)] p-10 text-xl">
                {t("loading")}
            </div>
        );
    }

    const handleImageUpload = async (e) => {

        try {

            const file = e.target.files[0];

            if (!file) return;

            const formData = new FormData();

            formData.append("profilePic", file);

            await uploadProfilePic(formData);

            fetchProfile();

            alert("✅ Profile Picture Updated");

        } catch (err) {

            console.log(err);

            alert("Upload Failed");

        }

    };

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");

        navigate("/login");

    };

    const handleLinkChange = (index, field, value) => {
        setLinksDraft((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    };

    const handleAddLinkRow = () => {
        if (linksDraft.length >= 5) return;
        setLinksDraft((prev) => [...prev, { label: "", url: "" }]);
    };

    const handleRemoveLinkRow = (index) => {
        setLinksDraft((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveChannelInfo = async () => {
        try {
            setSavingChannel(true);

            const cleanLinks = linksDraft.filter((l) => l.url.trim());

            const res = await updateChannelInfo({ bio: bioDraft, channelLinks: cleanLinks });

            setUser((u) => ({ ...u, bio: res.user.bio, channelLinks: res.user.channelLinks }));
            setLinksDraft(res.user.channelLinks?.length ? res.user.channelLinks : [{ label: "", url: "" }]);
            setEditingChannel(false);

        } catch (err) {
            alert(err.response?.data?.message || "Couldn't save channel info");
        } finally {
            setSavingChannel(false);
        }
    };

    const stats = [
        { label: t("nav_watchlater"), value: user.watchLaterCount, color: "var(--color-brand)" },
        { label: t("nav_history"), value: user.historyCount, color: "#38bdf8" },
        { label: "Liked", value: user.likedCount ?? 0, color: "#f87171" },
        { label: t("nav_favorites"), value: user.favoritesCount ?? 0, color: "#f472b6" },
        { label: "Subscribers", value: user.subscribersCount, color: "#5eead4" },
        { label: "Subscriptions", value: user.subscriptionsCount, color: "#a78bfa" },
        { label: "Music Followers", value: user.musicFollowersCount ?? 0, color: "#3B82F6" },
        { label: "Music Following", value: user.musicFollowingCount ?? 0, color: "#2DD4BF" },
    ];

    return (

        <div className="flex justify-center py-6 px-3 sm:px-4">

            <div className="w-full max-w-[560px] rounded-2xl p-5 sm:p-8 shadow-lg border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <div className="flex flex-col items-center">

                    {user.profilePic ? (

                        <img
                            src={user.profilePic.startsWith("http") ? user.profilePic : `${API_ROOT}${user.profilePic}`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4"
                            style={{ borderColor: "var(--color-brand)" }}
                        />

                    ) : (

                        <FaUserCircle className="text-8xl" style={{ color: "var(--color-brand)" }} />

                    )}

                    <label className="mt-4 brand-btn px-4 py-2 rounded-lg cursor-pointer">

                        Upload Photo

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />

                    </label>

                </div>

                <h1 className="text-3xl font-bold text-center mt-4" style={{ color: "var(--color-text)" }}>
                    {user.name}
                </h1>

                <p className="text-center mt-2" style={{ color: "var(--color-text-muted)" }}>
                    {user.email}
                </p>

                <div className="flex justify-center mt-3">
                    <Link
                        to={`/channel/${user._id}`}
                        className="text-sm font-medium"
                        style={{ color: "var(--color-brand)" }}
                    >
                        View my channel →
                    </Link>
                </div>

                {/* Channel Info — bio + links, shown on your public ChannelPage */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                            Channel Info
                        </h3>
                        {!editingChannel && (
                            <button
                                onClick={() => setEditingChannel(true)}
                                className="text-xs flex items-center gap-1"
                                style={{ color: "#5eead4" }}
                            >
                                <FaPen size={10} />
                                Edit
                            </button>
                        )}
                    </div>

                    {editingChannel ? (
                        <div className="space-y-3">

                            <textarea
                                value={bioDraft}
                                onChange={(e) => setBioDraft(e.target.value.slice(0, 500))}
                                placeholder="Tell viewers about your channel..."
                                rows={3}
                                className="w-full p-3 rounded-lg border outline-none text-sm resize-none"
                                style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                            <p className="text-xs -mt-2" style={{ color: "var(--color-text-faint)" }}>
                                {bioDraft.length}/500
                            </p>

                            <div className="space-y-2">
                                {linksDraft.map((link, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. Instagram)"
                                            value={link.label}
                                            onChange={(e) => handleLinkChange(i, "label", e.target.value)}
                                            className="w-28 p-2 rounded-lg border outline-none text-xs"
                                            style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                        />
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={link.url}
                                            onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                                            className="flex-1 p-2 rounded-lg border outline-none text-xs"
                                            style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                        />
                                        <button onClick={() => handleRemoveLinkRow(i)} style={{ color: "var(--color-danger)" }}>
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                ))}

                                {linksDraft.length < 5 && (
                                    <button
                                        onClick={handleAddLinkRow}
                                        className="text-xs flex items-center gap-1"
                                        style={{ color: "var(--color-brand)" }}
                                    >
                                        <FaPlus size={10} />
                                        Add link
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={handleSaveChannelInfo}
                                    disabled={savingChannel}
                                    className="brand-btn px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
                                >
                                    <FaCheck size={11} />
                                    {savingChannel ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingChannel(false);
                                        setBioDraft(user.bio || "");
                                        setLinksDraft(user.channelLinks?.length ? user.channelLinks : [{ label: "", url: "" }]);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm"
                                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                                >
                                    Cancel
                                </button>
                            </div>

                        </div>
                    ) : (
                        <>
                            {user.bio ? (
                                <p className="text-sm whitespace-pre-line" style={{ color: "var(--color-text-muted)" }}>
                                    {user.bio}
                                </p>
                            ) : (
                                <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
                                    No bio yet — add one so visitors know what your channel is about.
                                </p>
                            )}

                            {user.channelLinks?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {user.channelLinks.map((link, i) => (
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
                        </>
                    )}
                </div>

                {/* Interests */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                            Your Interests
                        </h3>
                        <Link
                            to="/onboarding"
                            className="text-xs flex items-center gap-1"
                            style={{ color: "#5eead4" }}
                        >
                            <FaPen size={10} />
                            Edit
                        </Link>
                    </div>

                    {user.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.interests.map((interest) => (
                                <span
                                    key={interest}
                                    className="text-xs px-3 py-1 rounded-full"
                                    style={{ backgroundColor: "var(--color-brand-soft)", color: "var(--color-brand)" }}
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <Link
                            to="/onboarding"
                            className="text-sm"
                            style={{ color: "var(--color-brand)" }}
                        >
                            Pick your interests →
                        </Link>
                    )}
                </div>

                {/* Language */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                        Language
                    </h3>
                    <LanguageSwitcher variant="full" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">

                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="p-4 rounded-xl text-center"
                            style={{ backgroundColor: "var(--color-surface-2)" }}
                        >
                            <h2 className="text-3xl font-bold" style={{ color: stat.color }}>
                                {stat.value}
                            </h2>
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                                {stat.label}
                            </p>
                        </div>
                    ))}

                </div>

                <button
                    onClick={handleLogout}
                    className="w-full mt-8 py-3 rounded-xl font-bold text-[var(--color-text)]"
                    style={{ backgroundColor: "var(--color-danger)" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-danger-dark)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-danger)"}
                >
                    {t("logout")}
                </button>

            </div>

        </div>

    );

}

export default Profile;
