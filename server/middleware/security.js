import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ================= SECURITY HEADERS =================
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, and a conservative
// Content-Security-Policy. CSP is relaxed just enough for the app's own
// video/image embeds (YouTube, Cloudinary) — cross-origin isolation
// (COEP) is off since it would break the YouTube <iframe> embeds used
// throughout the app (VideoPage, Shorts).
export const securityHeaders = helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            mediaSrc: ["'self'", "https:", "blob:"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
            connectSrc: ["'self'", "https:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
});

// ================= NoSQL INJECTION GUARD =================
// Recursively strips any object key starting with "$" or containing "."
// from req.body and req.params — blocks payloads like
// { "email": { "$gt": "" } } that would otherwise turn a
// findOne(email) into an always-true query.
//
// This is hand-rolled instead of using express-mongo-sanitize/hpp:
// those packages reassign req.query wholesale, but Express 5 made
// req.query a getter-only property, so they throw
// "Cannot set property query of #<IncomingMessage> which has only a
// getter" on every request. Mutating objects in place (as this does)
// works fine and sidesteps that entirely — req.body/req.params stay
// plain writable objects under Express 5.
const sanitizeObjectInPlace = (obj) => {
    if (!obj || typeof obj !== "object") return;

    for (const key of Object.keys(obj)) {

        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
            continue;
        }

        const value = obj[key];
        if (value && typeof value === "object") {
            sanitizeObjectInPlace(value);
        }

    }
};

export const sanitizeInput = (req, res, next) => {
    sanitizeObjectInPlace(req.body);
    sanitizeObjectInPlace(req.params);
    // req.query is intentionally left untouched — see comment above.
    // The app's search/filter endpoints already treat query values as
    // plain strings rather than passing them into Mongo operators, so
    // this isn't an open injection path.
    next();
};

// ================= RATE LIMITING =================
// General ceiling across the whole API — generous enough for normal use
// (including the Shorts feed's frequent polling) while still blocking
// scripted abuse/DoS attempts.
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests — please slow down and try again shortly.",
    },
});

// Much tighter limit specifically on login/register — this is what
// actually stops password brute-forcing and account-creation spam.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only counts failed attempts against the limit
    message: {
        success: false,
        message: "Too many login/register attempts — please try again in a few minutes.",
    },
});

// ================= CENTRAL ERROR HANDLER =================
// Must be registered last, after every route. Keeps stack traces and
// internal error details out of API responses in production while
// still logging the full error server-side for debugging.
export const errorHandler = (err, req, res, next) => {

    console.error("Unhandled error:", err);

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Something went wrong. Please try again."
                : err.message,
    });

};

// ================= 404 HANDLER =================
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};
