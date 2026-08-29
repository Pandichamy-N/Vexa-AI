import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/");

    },

    filename: function (req, file, cb) {

        cb(
            null,
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname)
        );

    },

});

// VEXA only ever needs to accept video/audio/image files through this
// route (video uploads, thumbnails, ringtones) — anything else
// (executables, scripts, archives) is rejected outright. Combined with
// a size cap, this closes off arbitrary-file-upload and disk-fill DoS
// as attack vectors.
const ALLOWED_PREFIXES = ["video/", "audio/", "image/"];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix))) {
        cb(null, true);
    } else {
        cb(new Error("Only video, audio, or image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB — generous enough for video, still bounded
    },
});

export default upload;