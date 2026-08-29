import axios from "axios";
import { API_ROOT } from "../config/api";

const API_URL = `${API_ROOT}/api/user`;

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Onboarding — save the user's picked interest categories (min 3)
export const updateInterests = (interests) =>
    axios.put(`${API_URL}/interests`, { interests }, authHeaders());

// Persist UI language preference to the account
export const updateLanguagePref = (language) =>
    axios.put(`${API_URL}/language`, { language }, authHeaders());

// VEXA Music Premium — mock upgrade/downgrade (no real payment gateway;
// this just flips the flag that gates ads on/off).
export const setPremium = (isPremium) =>
    axios.put(`${API_URL}/premium`, { isPremium }, authHeaders());

// VEXA Music: save picked favorite artists (Spotify-style, min 3)
export const updateFavoriteArtists = (artists) =>
    axios.put(`${API_URL}/favorite-artists`, { artists }, authHeaders());
