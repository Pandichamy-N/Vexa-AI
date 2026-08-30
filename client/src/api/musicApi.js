import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/music`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ================= CATALOG =================
export const searchMusic = (query, pageToken = null) =>
    axios.get(`${API_URL}/search`, { params: { q: query, ...(pageToken ? { pageToken } : {}) } });

// AI-curated "up next" — a blended, mood-matched continuation instead
// of just the next item in whatever list the track was played from.
export const getMusicNextTracks = (trackId, excludeIds = []) =>
    axios.get(`${API_URL}/next-up/${trackId}`, {
        ...authHeaders(),
        params: excludeIds.length ? { exclude: excludeIds.join(",") } : {},
    });

// ================= FAVORITES =================
export const getFavoriteTracks = () => axios.get(`${API_URL}/favorites`, authHeaders());

export const toggleFavoriteTrack = (trackId) =>
    axios.put(`${API_URL}/favorites/${trackId}`, {}, authHeaders());

export const checkFavoriteTrack = (trackId) =>
    axios.get(`${API_URL}/favorites/${trackId}/check`, authHeaders());

// ================= RECENTLY PLAYED =================
export const getRecentlyPlayed = () => axios.get(`${API_URL}/recently-played`, authHeaders());

export const recordRecentlyPlayed = (trackId) =>
    axios.post(`${API_URL}/recently-played/${trackId}`, {}, authHeaders());

// ================= SOCIAL (Follow) =================
export const getMusicProfile = (userId) =>
    axios.get(`${API_URL}/profile/${userId}`, authHeaders());

export const toggleFollowMusicUser = (userId) =>
    axios.put(`${API_URL}/follow/${userId}`, {}, authHeaders());

export const getMusicFollowers = (userId) =>
    axios.get(`${API_URL}/followers/${userId}`, authHeaders());

export const getMusicFollowing = (userId) =>
    axios.get(`${API_URL}/following/${userId}`, authHeaders());
