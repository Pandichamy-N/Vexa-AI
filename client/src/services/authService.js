import axios from "axios";
import { API_ROOT } from "../config/api";

const API = axios.create({
    baseURL: `${API_ROOT}/api`,
});

export const loginUser = async (userData) => {

    const response = await API.post("/auth/login", userData);

    return response.data;
};

export const registerUser = async (userData) => {

    const response = await API.post("/auth/register", userData);

    return response.data;
};

export const verifyEmailOtp = async (email, code) => {

    const response = await API.post("/auth/verify-email", { email, code });

    return response.data;
};

export const resendOtp = async (email) => {

    const response = await API.post("/auth/resend-otp", { email });

    return response.data;
};

export const forgotPassword = async (email) => {

    const response = await API.post("/auth/forgot-password", { email });

    return response.data;
};

export const resetPassword = async (email, token, newPassword) => {

    const response = await API.post("/auth/reset-password", { email, token, newPassword });

    return response.data;
};