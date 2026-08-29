// Backend API root. Set VITE_API_URL in the client's .env (or your
// hosting provider's environment variables) when you deploy — e.g.
// VITE_API_URL=https://api.yourdomain.com — and every api/*.js and
// services/*.js file picks it up automatically. Falls back to
// localhost so local development keeps working with zero setup.
export const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
