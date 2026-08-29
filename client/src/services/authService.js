import axios from "axios";
import { API_ROOT } from "../config/api";

const API = axios.create({
    baseURL: `${API_ROOT}/api`,
});

export const loginUser = async (userData) => {

    console.log("Email from frontend:", userData.email);

    const response = await API.post("/auth/login", userData);

    return response.data;
};

export const registerUser = async (userData) => {

    const response = await API.post("/auth/register", userData);

    return response.data;
};