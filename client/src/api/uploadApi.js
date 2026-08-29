import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/upload`;

export const uploadFile = async (file) => {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(API_URL, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};