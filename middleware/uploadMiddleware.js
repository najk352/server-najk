// C:\Users\Pharmacy\Desktop\jobportal-mern\server\middleware\uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary'); // Import Cloudinary config

// Multer memory storage is often preferred for Cloudinary as it works with buffers
const storage = multer.memoryStorage();

// Multer file filter (allows images and documents)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpeg/jpg/png) and documents (pdf/doc/docx) are allowed!'));
    }
};

const upload = multer({
    storage: storage, // Use memory storage
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB file size limit
    fileFilter: fileFilter
});

// Custom middleware to upload from Multer's buffer to Cloudinary
const uploadToCloudinary = (req, res, next) => {
    // If no file was uploaded by multer, skip to next middleware
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next();
    }

    // Determine if it's a single file (req.file) or multiple (req.files)
    const filesToProcess = req.file ? [req.file] : req.files.flatMap(f => f);

    Promise.all(filesToProcess.map(async (file) => {
        try {
            // Cloudinary upload expects a base64 string or buffer
            const result = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, // Convert buffer to base64
                {
                    folder: "najah_jobportal", // Optional: Cloudinary folder
                    resource_type: "auto",     // Automatically detect type
                    public_id: `${file.fieldname}-${Date.now()}` // Unique public ID
                }
            );
            file.cloudinaryUrl = result.secure_url; // Attach Cloudinary URL to the file object
        } catch (error) {
            console.error(`Error uploading ${file.originalname} to Cloudinary:`, error);
            throw new Error(`Failed to upload ${file.originalname} to Cloudinary`);
        }
    }))
    .then(() => next()) // All files uploaded, proceed
    .catch(error => {
        res.status(500).send(error.message); // Send error if any upload fails
    });
};

module.exports = {
    upload, // Multer instance
    uploadToCloudinary // Custom middleware for Cloudinary upload
};