import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/admin`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getAdminOverview = () => axios.get(`${API_URL}/overview`, authHeaders());

export const getAllUsersAdmin = () => axios.get(`${API_URL}/users`, authHeaders());
export const setUserRoleAdmin = (id, role) =>
    axios.put(`${API_URL}/users/${id}/role`, { role }, authHeaders());
export const deleteUserAdmin = (id) =>
    axios.delete(`${API_URL}/users/${id}`, authHeaders());

export const getAllVideosAdmin = () => axios.get(`${API_URL}/videos`, authHeaders());
export const deleteVideoAdmin = (id) =>
    axios.delete(`${API_URL}/videos/${id}`, authHeaders());
export const updateVideoCategoryAdmin = (id, category) =>
    axios.put(`${API_URL}/videos/${id}/category`, { category }, authHeaders());

export const getSyncChannelsAdmin = () => axios.get(`${API_URL}/sync-channels`, authHeaders());
export const addSyncChannelAdmin = (data) =>
    axios.post(`${API_URL}/sync-channels`, data, authHeaders());
export const toggleSyncChannelAdmin = (id) =>
    axios.put(`${API_URL}/sync-channels/${id}/toggle`, {}, authHeaders());
export const removeSyncChannelAdmin = (id) =>
    axios.delete(`${API_URL}/sync-channels/${id}`, authHeaders());
export const triggerSyncAdmin = () =>
    axios.post(`${API_URL}/sync-now`, {}, authHeaders());
