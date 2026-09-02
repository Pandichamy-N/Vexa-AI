import axios from "axios";

// Every api/*.js and services/*.js file in this app calls the default
// `axios` export directly (no shared instance), so a response
// interceptor registered here — once, at app startup — applies to
// every request the app makes.
//
// Without this, a 401 from the server (expired/invalid token) just
// surfaced as a swallowed promise rejection in whichever page made
// the call: the UI looked "stuck" or blank instead of sending the
// person back to the login page. This is what made refreshing or
// reopening the app after the session lapsed feel broken.
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
            const hadToken = Boolean(localStorage.getItem("token"));

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("userId");

            // Only force a redirect if the person actually had a
            // session that just got invalidated — a 401 from a
            // logged-out visitor hitting an optional-auth endpoint
            // shouldn't bounce them anywhere.
            if (hadToken && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
