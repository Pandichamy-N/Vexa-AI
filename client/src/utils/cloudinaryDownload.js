// Forces a real download (not "open in new tab") for a Cloudinary-hosted
// file by inserting Cloudinary's fl_attachment delivery flag. Only
// applies to our own uploaded files (native uploads) — never used on
// YouTube-sourced content.
export const getDownloadUrl = (url, filename) => {

    if (!url) return url;

    if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
        const safeName = encodeURIComponent(filename.replace(/[^\w\-. ]/g, "").slice(0, 100));
        return url.replace("/upload/", `/upload/fl_attachment:${safeName}/`);
    }

    return url;

};
