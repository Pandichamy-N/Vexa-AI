import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import {
    getMyVideos,
    deleteVideo,
    updateVideo,
} from "../api/videoApi";

function MyUploads() {

    const { t } = useContext(LanguageContext);

    const [videos, setVideos] = useState([]);
    const [editingVideo, setEditingVideo] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        category: "General",
        duration: "0:00",
        time: "",
        videoUrl: "",
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    // ================= FETCH MY VIDEOS =================

    const fetchVideos = async () => {
        try {

            const res = await getMyVideos();

            setVideos(res.data.videos);

        } catch (err) {

            console.log(err);

        }
    };

    // ================= DELETE VIDEO =================

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this video?"
        );

        if (!confirmDelete) return;

        try {

            await deleteVideo(id);

            alert("Video deleted successfully");

            fetchVideos();

        } catch (err) {

            console.log(err);

            alert("Delete failed");

        }

    };

    // ================= EDIT VIDEO =================

    const handleEdit = (video) => {

        setEditingVideo(video);

        setFormData({
            title: video.title,
            category: video.category || "General",
            duration: video.duration || "0:00",
            time: video.time,
            videoUrl: video.videoUrl,
        });

    };

    // ================= QUICK TOGGLE: MARK AS SHORT =================
    // No need to re-upload or open the edit form — flips just this one
    // field so an already-uploaded video can show up in the Shorts feed.
    const handleToggleShort = async (video) => {
        try {
            await updateVideo(video._id, {
                title: video.title,
                category: video.category,
                duration: video.duration,
                time: video.time,
                videoUrl: video.videoUrl,
                isShort: !video.isShort,
            });
            fetchVideos();
        } catch (err) {
            console.log(err);
            alert("Couldn't update");
        }
    };

    // ================= UPDATE VIDEO =================

    const handleUpdate = async () => {

        try {

            await updateVideo(
                editingVideo._id,
                formData
            );

            alert("Video updated successfully");

            setEditingVideo(null);

            fetchVideos();

        } catch (err) {

            console.log(err);

            alert("Update failed");

        }

    };

    // ================= UI =================
    return (
    <div className="p-6 text-[var(--color-text)]">

        <h1 className="text-3xl font-bold mb-6">
            {t("nav_myuploads")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {videos.map((video) => (

                <Link
                    key={video._id}
                    to={`/video/${video._id}`}
                >

                    <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden hover:scale-105 transition">

                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                        />

                        <div className="p-4">

                            <h2 className="font-semibold">
                                {video.title}
                            </h2>

                            <p className="text-[var(--color-text-muted)] text-sm mt-2">
                                👁 {video.views} • {video.time}
                                {video.isShort && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--color-brand-soft)", color: "var(--color-brand)" }}>
                                        Short
                                    </span>
                                )}
                            </p>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleShort(video);
                                }}
                                className="mt-3 w-full py-2 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                            >
                                {video.isShort ? "Remove from Shorts" : "⚡ Mark as Short"}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleEdit(video);
                                }}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
                            >
                                ✏ Edit Video
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(video._id);
                                }}
                                className="mt-3 w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg"
                            >
                                🗑 Delete Video
                            </button>

                        </div>

                    </div>

                </Link>

            ))}

        </div>

        {editingVideo && (

            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">

                <div className="bg-[var(--color-surface)] p-5 sm:p-6 rounded-xl w-full max-w-[384px]">

                    <h2 className="text-2xl font-bold mb-5">
                        Edit Video
                    </h2>

                    <input
                        type="text"
                        placeholder="Title"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                title: e.target.value,
                            })
                        }
                        className="w-full p-3 mb-3 rounded bg-[var(--color-surface-2)]"
                    />

                    <select
                        value={formData.category}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                category: e.target.value,
                            })
                        }
                        className="w-full p-3 mb-3 rounded bg-[var(--color-surface-2)]"
                    >
                        <option>General</option>
                        <option>Education</option>
                        <option>Programming</option>
                        <option>Technology</option>
                        <option>Gaming</option>
                        <option>Music</option>
                        <option>Entertainment</option>
                        <option>Sports</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Duration (10:35)"
                        value={formData.duration}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                duration: e.target.value,
                            })
                        }
                        className="w-full p-3 mb-3 rounded bg-[var(--color-surface-2)]"
                    />

                    <input
                        type="text"
                        placeholder="Time"
                        value={formData.time}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                time: e.target.value,
                            })
                        }
                        className="w-full p-3 mb-5 rounded bg-[var(--color-surface-2)]"
                    />

                    <div className="flex gap-3">

                        <button
                            onClick={handleUpdate}
                            className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg"
                        >
                            💾 Save
                        </button>

                        <button
                            onClick={() => setEditingVideo(null)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg"
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            </div>

        )}

    </div>

    );

}

export default MyUploads;