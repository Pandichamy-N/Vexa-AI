import { useContext, useState } from "react";
import { addVideo } from "../api/videoApi";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../api/uploadApi";
import { suggestUploadTags, importFromYoutube } from "../api/aiApi";
import { FaRobot, FaUpload, FaCheckCircle } from "react-icons/fa";
import { LanguageContext } from "../context/LanguageContext";

function UploadVideo() {

    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    // "ai" = paste a YouTube link, AI fills everything in.
    // "manual" = pick files and fill the form yourself.
    const [mode, setMode] = useState("ai");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        channel: "",
        category: "Education",
        duration: "",
        time: "Just now",
        isShort: false,
    });

    const [tags, setTags] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // ================= AI: SUGGEST TAGS/CATEGORY (manual mode) =================
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const [aiError, setAiError] = useState("");

    // ================= AI: YOUTUBE IMPORT (ai mode) =================
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState("");
    // Populated once AI import succeeds — carries the fields a manual
    // upload would otherwise get from files (thumbnail, video source).
    const [importedMedia, setImportedMedia] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // ================= AI YOUTUBE IMPORT =================
    const handleAiImport = async () => {

        if (!youtubeUrl.trim()) {
            alert("Paste a YouTube link first.");
            return;
        }

        try {

            setImporting(true);
            setImportError("");

            const data = await importFromYoutube(youtubeUrl);

            setFormData((prev) => ({
                ...prev,
                title: data.title || "",
                description: data.description || "",
                channel: data.channel || "",
                category: data.category || prev.category,
            }));

            setTags(data.tags || []);

            setImportedMedia({
                videoId: data.videoId,
                videoUrl: data.videoUrl,
                thumbnail: data.thumbnail,
            });

        } catch (error) {

            console.log(error);

            setImportError(
                error.response?.data?.message ||
                "Couldn't import that video. Check the link and try again."
            );

            setImportedMedia(null);

        } finally {

            setImporting(false);

        }

    };

    // ================= AI: SUGGEST TAGS/CATEGORY (manual mode) =================
    const handleAiSuggest = async () => {

        if (!formData.title.trim()) {
            alert("Add a title first so AI has something to work with.");
            return;
        }

        try {

            setAiSuggesting(true);
            setAiError("");

            const data = await suggestUploadTags(
                formData.title,
                formData.description
            );

            setFormData((prev) => ({
                ...prev,
                category: data.category || prev.category,
            }));

            setTags(data.tags || []);

        } catch (error) {

            console.log(error);

            setAiError(
                error.response?.data?.message ||
                "Couldn't get AI suggestions right now."
            );

        } finally {

            setAiSuggesting(false);

        }

    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setImportError("");
        setAiError("");
    };

    // ================= PUBLISH =================
    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.title.trim()) {
            alert("Add a title.");
            return;
        }

        if (mode === "manual" && (!thumbnailFile || !videoFile)) {
            alert("Please select a thumbnail and a video file.");
            return;
        }

        if (mode === "ai" && !importedMedia) {
            alert("Import a YouTube video with AI first, or switch to Manual Upload.");
            return;
        }

        try {

            setUploading(true);

            let thumbnail;
            let videoUrl;
            let videoId;

            if (mode === "manual") {

                const thumbnailRes = await uploadFile(thumbnailFile);
                const videoRes = await uploadFile(videoFile);

                thumbnail = thumbnailRes.url;
                videoUrl = videoRes.url;
                videoId = "";

            } else {

                thumbnail = importedMedia.thumbnail;
                videoUrl = importedMedia.videoUrl;
                videoId = importedMedia.videoId;

            }

            const newVideo = {
                ...formData,
                tags,
                thumbnail,
                videoUrl,
                videoId,
                views: 0,
            };

            await addVideo(newVideo);

            alert("✅ Video Uploaded Successfully!");

            navigate("/");

        } catch (error) {

            console.log("Upload Error:", error);

            if (error.response) {
                console.log(error.response.data);
            }

            alert("❌ Upload Failed!");

        } finally {

            setUploading(false);

        }

    };

    const inputClass =
        "w-full p-3 rounded-lg outline-none border transition-colors";
    const inputStyle = {
        backgroundColor: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
    };

    return (
        <div className="max-w-3xl mx-auto py-6">

            <h1
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
            >
                Upload Video
            </h1>

            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
                Import straight from YouTube and let AI fill in the details, or upload your own files.
            </p>

            {/* ================= MODE SWITCHER ================= */}
            <div
                className="flex rounded-full p-1 mb-6 w-fit border"
                style={{
                    backgroundColor: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                }}
            >

                <button
                    type="button"
                    onClick={() => switchMode("ai")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all ${
                        mode === "ai" ? "ai-btn" : ""
                    }`}
                    style={mode !== "ai" ? { color: "var(--color-text-muted)" } : {}}
                >
                    <FaRobot />
                    {t("ai_import")}
                </button>

                <button
                    type="button"
                    onClick={() => switchMode("manual")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all ${
                        mode === "manual" ? "brand-btn" : ""
                    }`}
                    style={mode !== "manual" ? { color: "var(--color-text-muted)" } : {}}
                >
                    <FaUpload />
                    {t("manual_upload")}
                </button>

            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl p-8 space-y-5 shadow-lg border"
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                }}
            >

                {/* ================= AI IMPORT MODE ================= */}
                {mode === "ai" && (

                    <div className="ai-panel rounded-lg p-5 space-y-4">

                        <div>
                            <label
                                className="text-sm font-semibold flex items-center gap-2 mb-2"
                                style={{ color: "var(--color-text)" }}
                            >
                                <FaRobot style={{ color: "#5eead4" }} />
                                Paste a YouTube link
                            </label>

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                />

                                <button
                                    type="button"
                                    onClick={handleAiImport}
                                    disabled={importing}
                                    className="ai-btn px-5 rounded-lg text-sm whitespace-nowrap"
                                >
                                    {importing ? "..." : t("fetch_with_ai")}
                                </button>

                            </div>

                            <p
                                className="text-xs mt-2"
                                style={{ color: "var(--color-text-faint)" }}
                            >
                                No file upload needed — AI pulls the title and thumbnail from YouTube and drafts a description, category, and tags for you to review below.
                            </p>

                            {importError && (
                                <p className="text-red-400 text-sm mt-2">{importError}</p>
                            )}

                        </div>

                        {importedMedia && (

                            <div className="flex items-center gap-3 pt-2 border-t border-teal-800/30">

                                <img
                                    src={importedMedia.thumbnail}
                                    alt="Imported thumbnail"
                                    className="w-28 h-16 object-cover rounded-md"
                                />

                                <div className="flex items-center gap-2 text-sm text-teal-300">
                                    <FaCheckCircle />
                                    Imported — review the fields below, then publish.
                                </div>

                            </div>

                        )}

                    </div>

                )}

                {/* Video Title */}
                <input
                    type="text"
                    name="title"
                    placeholder="Video Title"
                    value={formData.title}
                    onChange={handleChange}
                    className={inputClass}
                    style={inputStyle}
                />

                {/* Video Description */}
                <textarea
                    name="description"
                    placeholder="Video Description (used by AI for summaries, tags, and Q&A)"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={inputClass}
                    style={inputStyle}
                />

                {/* Channel Name */}
                <input
                    type="text"
                    name="channel"
                    placeholder="Channel Name"
                    value={formData.channel}
                    onChange={handleChange}
                    className={inputClass}
                    style={inputStyle}
                />

                {/* ================= MANUAL MODE: FILE PICKERS ================= */}
                {mode === "manual" && (

                    <div className="space-y-4">

                        <div>
                            <label
                                className="text-xs mb-1 block"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                Thumbnail image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setThumbnailFile(e.target.files[0])}
                                className={inputClass}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label
                                className="text-xs mb-1 block"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                Video file
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setVideoFile(e.target.files[0])}
                                className={inputClass}
                                style={inputStyle}
                            />
                        </div>

                        {/* AI Suggest Tags/Category — only needed here; AI Import already suggests these */}
                        <div className="ai-panel rounded-lg p-4">

                            <button
                                type="button"
                                onClick={handleAiSuggest}
                                disabled={aiSuggesting}
                                className="ai-btn px-5 py-2 rounded-lg text-sm"
                            >
                                <FaRobot />
                                {aiSuggesting ? "Thinking..." : "Suggest Category & Tags with AI"}
                            </button>

                            {aiError && (
                                <p className="text-red-400 text-sm mt-2">{aiError}</p>
                            )}

                        </div>

                    </div>

                )}

                {/* Tags (shared — populated by either AI flow, editable) */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="flex items-center gap-2 bg-teal-900/30 text-teal-200 text-xs px-3 py-1 rounded-full"
                            >
                                #{tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="text-teal-300 hover:text-[var(--color-text)]"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Video Category */}
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={inputClass}
                    style={inputStyle}
                >
                    <option>Education</option>
                    <option>Programming</option>
                    <option>Gaming</option>
                    <option>Music</option>
                    <option>Technology</option>
                    <option>Entertainment</option>
                    <option>Sports</option>
                </select>

                {/* Video Duration */}
                <input
                    type="text"
                    name="duration"
                    placeholder="Duration, e.g. 10:35 (optional)"
                    value={formData.duration}
                    onChange={handleChange}
                    className={inputClass}
                    style={inputStyle}
                />

                {/* Post as a Short — vertical, under a minute, shows up in the Shorts feed */}
                <label
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm"
                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                >
                    <input
                        type="checkbox"
                        checked={formData.isShort}
                        onChange={(e) => setFormData({ ...formData, isShort: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <span>
                        Post as a Short
                        <span className="block text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            Vertical video under 60s — shows up in the Shorts feed instead of the main grid.
                        </span>
                    </span>
                </label>

                {/* Upload Time */}
                <input
                    type="text"
                    name="time"
                    placeholder="Upload Time (Example: 2 days ago)"
                    value={formData.time}
                    onChange={handleChange}
                    className={inputClass}
                    style={inputStyle}
                />

                {/* Button */}
                <button
                    type="submit"
                    disabled={uploading}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {uploading ? "..." : t("publish_video")}
                </button>

            </form>

        </div>
    );
}

export default UploadVideo;
