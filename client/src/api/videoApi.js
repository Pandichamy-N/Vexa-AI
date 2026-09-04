import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/videos`;
const USER_API = `${API_ROOT}/api/user`;

// ================= VIDEO =================

// Get all videos
export const getVideos = () => {
    return axios.get(API_URL);
};

// Get the Shorts feed — personalized (based on watch history/likes/
// searches, same signal "Recommended for You" uses) when logged in,
// random shuffle otherwise. Pass the currently-open short's id to
// exclude it from the next batch.
export const getShorts = (excludeId) => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/shorts`, {
        params: excludeId ? { exclude: excludeId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};

// Search YouTube for real Shorts (<=60s clips) and add any new ones —
// same idea as the main "Sync"/auto-fetch button, so the Shorts feed
// doesn't stay empty until someone manually uploads/marks one.
export const autoFetchShorts = () => {
    const token = localStorage.getItem("token");

    return axios.post(
        `${API_URL}/auto-fetch-shorts`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Get related videos for a specific video (excludes the video itself)
export const getRelatedVideos = (videoId) => {
    return axios.get(`${API_URL}/related/${videoId}`);
};

// AI-curated "up next" queue for VEXA Music auto-continue — the LLM
// orders a same-category shortlist by mood/style fit, not just tag overlap.
export const getAiNextTracks = (videoId) => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/next-up/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Get AI-ranked trending videos
export const getTrendingVideos = () => {
    return axios.get(`${API_URL}/trending`);
};

// Get videos grouped by category
export const getCategorizedVideos = () => {
    return axios.get(`${API_URL}/categorized`);
};

// Trigger an on-demand AI-enriched sync of new videos from YouTube
export const autoFetchVideos = () => {
    const token = localStorage.getItem("token");

    return axios.post(
        `${API_URL}/auto-fetch`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Latest uploads
export const getLatestVideos = () => axios.get(`${API_URL}/latest`);

// Most viewed
export const getMostViewedVideos = () => axios.get(`${API_URL}/most-viewed`);

// Personalized recommendations (requires auth)
export const getRecommendedVideos = () => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/recommended`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Top Picks — filtered strictly to the user's onboarding interest picks
export const getTopPicks = () => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/top-picks`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// AI semantic search (requires auth, since results are logged per-user
// to power personalization + "Most Searched")
export const searchVideosAI = (query, category, pageToken) => {
    const token = localStorage.getItem("token");

    const params = { q: query };
    if (category) params.category = category;
    if (pageToken) params.pageToken = pageToken;

    return axios.get(`${API_URL}/search`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Most searched queries (last 7 days)
export const getMostSearched = () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/most-searched`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};

// Fast live-search suggestions (no AI, used for the Navbar dropdown)
export const quickSearchVideos = (query) =>
    axios.get(`${API_URL}/quick-search`, { params: { q: query } });

// Add new video
export const addVideo = (videoData) => {
    const token = localStorage.getItem("token");

    return axios.post(
        API_URL,
        videoData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Like video
export const likeVideo = (id) => {
    const token = localStorage.getItem("token");

    return axios.put(
        `${API_URL}/${id}/like`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Add comment
export const addComment = (id, commentData) => {
    const token = localStorage.getItem("token");

    return axios.post(
        `${API_URL}/${id}/comment`,
        commentData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// ================= WATCH LATER =================

// Add Watch Later
export const addToWatchLater = (id, token) => {
    return axios.put(
        `${USER_API}/watchlater/${id}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Get Watch Later
export const getWatchLater = (token) => {
    return axios.get(
        `${USER_API}/watchlater`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Remove Watch Later
export const removeWatchLater = (id, token) => {
    return axios.delete(
        `${USER_API}/watchlater/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// ================= HISTORY =================

// Add History
export const addToHistory = (id, token) => {
    return axios.put(
        `${USER_API}/history/${id}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// Get History
export const getHistory = (token) => {
    return axios.get(
        `${USER_API}/history`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};
export const getMyVideos = () => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/myvideos`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
export const deleteVideo = (id) => {
    const token = localStorage.getItem("token");

    return axios.delete(`${API_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};


export const getChannelVideos = (userId) => {
    return axios.get(`${API_URL}/channel/${userId}`);
};

export const getDashboard = async () => {
    const token = localStorage.getItem("token");

    return axios.get(`${API_URL}/dashboard`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const increaseView = (videoId) =>
    axios.put(`${API_URL}/view/${videoId}`);

export const updateVideo = (id, data) => {

    const token = localStorage.getItem("token");

    return axios.put(
        `${API_URL}/${id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

};

export const getDashboardStats = () =>
    axios.get(`${API_URL}/dashboard/stats`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

// NOTE: AI-related calls (summary, tag suggestions, Q&A) now live in
// ../api/aiApi.js so all AI endpoints are in one place.