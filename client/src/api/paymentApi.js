import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/payment`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Creates a real Razorpay order server-side (amount is set on the
// backend, never trusted from the client).
export const createOrder = () =>
    axios.post(`${API_URL}/create-order`, {}, authHeaders());

// Sends Razorpay's post-payment response back for signature
// verification — this is what actually activates Premium.
export const verifyPayment = (payload) =>
    axios.post(`${API_URL}/verify`, payload, authHeaders());
