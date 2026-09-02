import axios from "axios";
import { API_ROOT } from "../config/api";

const USER_API = `${API_ROOT}/api/user`;

// ================= PROFILE =================
export const getProfile = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${USER_API}/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

// ================= CHANNEL INFO (name, bio, links) =================
export const updateChannelInfo = async (data) => {
    const token = localStorage.getItem("token");

    const response = await axios.put(`${USER_API}/channel-info`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

// ================= CHANNEL FOLLOWERS (public) =================
export const getChannelFollowers = async (userId) => {
    const response = await axios.get(`${USER_API}/${userId}/followers`);
    return response.data;
};

// ================= SUBSCRIBE =================
export const subscribeToChannel = async (channelId) => {
    const token = localStorage.getItem("token");

    const response = await axios.put(
        `${USER_API}/subscribe/${channelId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

// ================= UNSUBSCRIBE =================
export const unsubscribeFromChannel = async (channelId) => {
    const token = localStorage.getItem("token");

    const response = await axios.delete(
        `${USER_API}/subscribe/${channelId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

// ================= CHECK SUBSCRIPTION =================
export const checkSubscription = async (channelId) => {
    const token = localStorage.getItem("token");

    const response = await axios.get(
        `${USER_API}/subscribe/${channelId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const uploadProfilePic = async (formData) => {
    const token = localStorage.getItem("token");

    const res = await axios.put(
        `${USER_API}/profile/upload`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};
// ================= FAVORITES =================
export const getFavorites = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${USER_API}/favorites`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

// Toggles favorite state for a video and returns { favorited, favorites }
export const toggleFavorite = async (videoId) => {
    const token = localStorage.getItem("token");

    const response = await axios.put(
        `${USER_API}/favorites/${videoId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const checkFavorite = async (videoId) => {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${USER_API}/favorites/${videoId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};
