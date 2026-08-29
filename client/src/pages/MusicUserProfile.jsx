import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaUserCircle, FaUserPlus, FaUserCheck, FaMusic } from "react-icons/fa";
import { API_ROOT } from "../config/api";
import { getMusicProfile, toggleFollowMusicUser } from "../api/musicApi";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";

function MusicUserProfile() {

    const { userId } = useParams();
    const navigate = useNavigate();
    const { t } = useContext(LanguageContext);
    const { showToast } = useContext(ToastContext);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [following, setFollowing] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await getMusicProfile(userId);
            setProfile(res.data.profile);
            setFollowing(res.data.profile.isFollowing);

        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Couldn't load this profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        try {
            setProcessing(true);
            const res = await toggleFollowMusicUser(userId);
            setFollowing(res.data.following);
            setProfile((prev) => ({ ...prev, followersCount: res.data.followersCount }));
            showToast(
                res.data.following ? `Following ${profile.name}` : `Unfollowed ${profile.name}`,
                "success"
            );
        } catch (err) {
            showToast(err.response?.data?.message || "Couldn't update follow status.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>;
    }

    if (error || !profile) {
        return (
            <div className="text-center mt-16">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                    {error || "Profile not found"}
                </h2>
                <button onClick={() => navigate("/music")} style={{ color: "var(--color-brand)" }}>
                    ← Back to VEXA Music
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-center py-6 px-3 sm:px-4">

            <div
                className="w-full max-w-[480px] rounded-2xl p-5 sm:p-8 shadow-lg border text-center"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >

                {profile.profilePic ? (
                    <img
                        src={profile.profilePic.startsWith("http") ? profile.profilePic : `${API_ROOT}${profile.profilePic}`}
                        alt={profile.name}
                        className="w-28 h-28 rounded-full object-cover border-4 mx-auto"
                        style={{ borderColor: "var(--color-brand)" }}
                    />
                ) : (
                    <FaUserCircle className="text-7xl mx-auto" style={{ color: "var(--color-brand)" }} />
                )}

                <h1 className="text-2xl font-bold mt-4" style={{ color: "var(--color-text)" }}>
                    {profile.name}
                </h1>

                <p
                    className="flex items-center justify-center gap-1.5 text-xs mt-1"
                    style={{ color: "var(--color-text-faint)" }}
                >
                    <FaMusic size={10} />
                    VEXA Music listener
                </p>

                <div className="flex items-center justify-center gap-8 mt-6">
                    <div>
                        <p className="text-2xl font-bold" style={{ color: "var(--color-brand)" }}>{profile.followersCount}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Followers</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: "#5eead4" }}>{profile.followingCount}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Following</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: "#f87171" }}>{profile.likedSongsCount}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Liked Songs</p>
                    </div>
                </div>

                {!profile.isSelf && (
                    <button
                        onClick={handleToggleFollow}
                        disabled={processing}
                        className={`flex items-center gap-2 mx-auto mt-8 px-6 py-2.5 rounded-full text-sm ${following ? "" : "brand-btn"}`}
                        style={following ? { border: "1px solid var(--color-border)", color: "var(--color-text-muted)" } : {}}
                    >
                        {following ? <FaUserCheck size={13} /> : <FaUserPlus size={13} />}
                        {processing ? "..." : following ? "Following" : "Follow"}
                    </button>
                )}

            </div>

        </div>
    );
}

export default MusicUserProfile;
