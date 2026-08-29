import axios from "axios";
import { API_ROOT } from "../config/api";

const PLAYLIST_API = `${API_ROOT}/api/playlists`;

const getToken = () => localStorage.getItem("token");

// ================= CREATE PLAYLIST =================
export const createPlaylist = async (name) => {
    const response = await axios.post(
        PLAYLIST_API,
        { name },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

// ================= GET PLAYLISTS =================
export const getMyPlaylists = async () => {
    const response = await axios.get(
        PLAYLIST_API,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

export const addVideoToPlaylist = async (
    playlistId,
    videoId
) => {

    const response = await axios.put(
        `${PLAYLIST_API}/${playlistId}/${videoId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

// ================= GET SINGLE PLAYLIST (with videos) =================
export const getPlaylistById = async (playlistId) => {
    const response = await axios.get(
        `${PLAYLIST_API}/${playlistId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

// ================= REMOVE VIDEO FROM PLAYLIST =================
export const removeVideoFromPlaylist = async (playlistId, videoId) => {
    const response = await axios.delete(
        `${PLAYLIST_API}/${playlistId}/${videoId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

// ================= DELETE PLAYLIST =================
export const deletePlaylist = async (playlistId) => {
    const response = await axios.delete(
        `${PLAYLIST_API}/${playlistId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};
// ================= VEXA MUSIC: ADD TRACK TO PLAYLIST =================
export const addTrackToPlaylist = async (playlistId, trackId) => {
    const response = await axios.put(
        `${PLAYLIST_API}/${playlistId}/track/${trackId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};

// ================= VEXA MUSIC: REMOVE TRACK FROM PLAYLIST =================
export const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const response = await axios.delete(
        `${PLAYLIST_API}/${playlistId}/track/${trackId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );

    return response.data;
};
