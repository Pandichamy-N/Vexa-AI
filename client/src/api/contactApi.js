import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/contact`;

export const submitContactMessage = (data) => {
    const token = localStorage.getItem("token");
    return axios.post(API_URL, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};
