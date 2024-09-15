import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only image files are allowed!"), false);
    }

    cb(null, true);
}

export const upload = multer({ storage, fileFilter });
