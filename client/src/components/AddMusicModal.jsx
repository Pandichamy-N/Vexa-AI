import { useState } from "react";
import { FaTimes, FaRobot, FaUpload, FaCheckCircle, FaMusic } from "react-icons/fa";
import { addVideo } from "../api/videoApi";
import { uploadFile } from "../api/uploadApi";
import { suggestUploadTags, importFromYoutube } from "../api/aiApi";

// A music-focused add flow — same backend as the general Upload page,
// but with music-appropriate fields (Artist instead of Channel, category
// locked to "Music") and reached directly from VEXA Music instead of
// making people find the generic Upload page and pick a category.
function AddMusicModal({ onClose, onAdded }) {

    const [mode, setMode] = useState("ai"); // "ai" = paste YouTube link, "file" = upload a file

    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        description: "",
    });
    const [tags, setTags] = useState([]);

    const [audioFile, setAudioFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState("");
    const [importedMedia, setImportedMedia] = useState(null);

    const [aiSuggesting, setAiSuggesting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ================= AI IMPORT FROM YOUTUBE =================
    const handleAiImport = async () => {

        if (!youtubeUrl.trim()) {
            alert("Paste a YouTube link first.");
            return;
        }

        try {
            setImporting(true);
            setImportError("");

            const data = await importFromYoutube(youtubeUrl);

            setFormData({
                title: data.title || "",
                artist: data.channel || "",
                description: data.description || "",
            });
            setTags(data.tags || []);

            setImportedMedia({
                videoId: data.videoId,
                videoUrl: data.videoUrl,
                thumbnail: data.thumbnail,
            });

        } catch (error) {
            setImportError(error.response?.data?.message || "Couldn't import that link.");
            setImportedMedia(null);
        } finally {
            setImporting(false);
        }

    };

    // ================= AI SUGGEST TAGS (file mode) =================
    const handleAiSuggestTags = async () => {

        if (!formData.title.trim()) {
            alert("Add a track title first.");
            return;
        }

        try {
            setAiSuggesting(true);
            const data = await suggestUploadTags(formData.title, formData.description);
            setTags(data.tags || []);
        } catch (error) {
            console.log(error);
        } finally {
            setAiSuggesting(false);
        }

    };

    const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

    // ================= SUBMIT =================
    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.title.trim() || !formData.artist.trim()) {
            alert("Add a title and artist name.");
            return;
        }

        if (mode === "file" && (!audioFile || !thumbnailFile)) {
            alert("Pick an audio/video file and a cover image.");
            return;
        }

        if (mode === "ai" && !importedMedia) {
            alert("Import a track with AI first, or switch to Upload File.");
            return;
        }

        try {
            setUploading(true);

            let thumbnail, videoUrl, videoId;

            if (mode === "file") {
                const thumbnailRes = await uploadFile(thumbnailFile);
                const audioRes = await uploadFile(audioFile);
                thumbnail = thumbnailRes.url;
                videoUrl = audioRes.url;
                videoId = "";
            } else {
                thumbnail = importedMedia.thumbnail;
                videoUrl = importedMedia.videoUrl;
                videoId = importedMedia.videoId;
            }

            await addVideo({
                title: formData.title,
                description: formData.description,
                channel: formData.artist,
                category: "Music",
                tags,
                thumbnail,
                videoUrl,
                videoId,
                duration: "",
                time: "Just now",
                views: 0,
            });

            onAdded?.();
            onClose();

        } catch (error) {
            console.log(error);
            alert("Couldn't add this track. Try again.");
        } finally {
            setUploading(false);
        }

    };

    const inputClass = "w-full p-3 rounded-lg outline-none border text-sm";
    const inputStyle = {
        backgroundColor: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
            <div
                className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border p-6 relative animate-fade-up"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >

                <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "var(--color-text-faint)" }}>
                    <FaTimes />
                </button>

                <div className="flex items-center gap-2 mb-5">
                    <FaMusic style={{ color: "var(--color-brand)" }} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                        Add Music
                    </h2>
                </div>

                {/* Mode switcher */}
                <div
                    className="flex rounded-full p-1 mb-5 w-fit border"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                >
                    <button
                        type="button"
                        onClick={() => setMode("ai")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs ${mode === "ai" ? "ai-btn" : ""}`}
                        style={mode !== "ai" ? { color: "var(--color-text-muted)" } : {}}
                    >
                        <FaRobot size={11} />
                        AI Import
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("file")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs ${mode === "file" ? "brand-btn" : ""}`}
                        style={mode !== "file" ? { color: "var(--color-text-muted)" } : {}}
                    >
                        <FaUpload size={11} />
                        Upload File
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">

                    {mode === "ai" && (
                        <div className="ai-panel rounded-lg p-4 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Paste a YouTube music link..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                />
                                <button
                                    type="button"
                                    onClick={handleAiImport}
                                    disabled={importing}
                                    className="ai-btn px-4 rounded-lg text-xs whitespace-nowrap"
                                >
                                    {importing ? "..." : "Fetch"}
                                </button>
                            </div>

                            {importError && <p className="text-red-400 text-xs">{importError}</p>}

                            {importedMedia && (
                                <div className="flex items-center gap-2 text-xs" style={{ color: "#5eead4" }}>
                                    <FaCheckCircle />
                                    Imported — review the fields below, then add.
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "file" && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>Cover image</label>
                                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0])} className={inputClass} style={inputStyle} />
                            </div>
                            <div>
                                <label className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>Audio/video file (mp3, m4a, mp4...)</label>
                                <input type="file" accept="audio/*,video/*" onChange={(e) => setAudioFile(e.target.files[0])} className={inputClass} style={inputStyle} />
                            </div>
                        </div>
                    )}

                    <input
                        type="text"
                        name="title"
                        placeholder="Track Title"
                        value={formData.title}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle}
                    />

                    <input
                        type="text"
                        name="artist"
                        placeholder="Artist Name"
                        value={formData.artist}
                        onChange={handleChange}
                        className={inputClass}
                        style={inputStyle}
                    />

                    <textarea
                        name="description"
                        placeholder="Description (optional)"
                        value={formData.description}
                        onChange={handleChange}
                        rows={2}
                        className={inputClass}
                        style={inputStyle}
                    />

                    {mode === "file" && (
                        <button
                            type="button"
                            onClick={handleAiSuggestTags}
                            disabled={aiSuggesting}
                            className="ai-btn px-4 py-2 rounded-lg text-xs flex items-center gap-2"
                        >
                            <FaRobot size={11} />
                            {aiSuggesting ? "Thinking..." : "Suggest Genre Tags with AI"}
                        </button>
                    )}

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--color-brand-soft)", color: "var(--color-brand)" }}>
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(tag)}>✕</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={uploading}
                        className="brand-btn w-full py-2.5 rounded-lg text-sm mt-2"
                    >
                        {uploading ? "Adding..." : "Add to VEXA Music"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default AddMusicModal;
