import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadFile = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const result = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: "streammind-ai",
                resource_type: "auto",
            }
        );

        // Delete temporary local file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};