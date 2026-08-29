import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/notifications`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getMyNotifications = () => axios.get(API_URL, authHeaders());

export const markNotificationRead = (id) =>
    axios.put(`${API_URL}/${id}/read`, {}, authHeaders());

export const markAllNotificationsRead = () =>
    axios.put(`${API_URL}/read-all`, {}, authHeaders());
