import multer from "multer";
import path from "path";
import fs from "fs";

// "uploads/" is git-ignored, so it doesn't exist on a fresh deploy (Render,
// etc.) — and multer does NOT create a folder given as a function result,
// so every upload would fail with ENOENT. Create it up front.
fs.mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname)
        );
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB — plenty for a profile picture
    },
});

export default upload;