import axios from "axios";
import { API_ROOT } from "../config/api";

const AI_API = `${API_ROOT}/api/ai`;

const authHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

// ================= AI VIDEO SUMMARY =================
// Cached on the backend once generated for a given videoId.
// Pass force: true to regenerate.
export const getVideoSummary = async (videoId, force = false) => {
    const res = await axios.post(
        `${AI_API}/summary`,
        { videoId, force },
        authHeaders()
    );

    return res.data;
};

// ================= AI UPLOAD SUGGESTIONS (tags/category) =================
export const suggestUploadTags = async (title, description) => {
    const res = await axios.post(
        `${AI_API}/suggest-tags`,
        { title, description },
        authHeaders()
    );

    return res.data;
};

// ================= AI YOUTUBE IMPORT (no manual file upload) =================
export const importFromYoutube = async (youtubeUrl) => {
    const res = await axios.post(
        `${AI_API}/import-youtube`,
        { youtubeUrl },
        authHeaders()
    );

    return res.data;
};

// ================= SITE-WIDE AI CHATBOT =================
export const sendChatMessage = async (message, history = []) => {
    const res = await axios.post(
        `${AI_API}/chatbot`,
        { message, history },
        authHeaders()
    );

    return res.data;
};

// ================= AI VIDEO Q&A =================
export const askAboutVideo = async (videoId, question) => {
    const res = await axios.post(
        `${AI_API}/ask`,
        { videoId, question },
        authHeaders()
    );

    return res.data;
};
