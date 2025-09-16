const multer = require('multer');
const path = require('path');
const { uploadFileToBlob } = require('../config/azureBlobStorage'); // Import blob utility
const fs = require('fs');
// Multer disk storage - used to temporarily store file before uploading to blob
// For large files, consider Multer's memoryStorage if you can handle buffers,
// but diskStorage is safer for larger uploads to prevent OOM errors.
const tempStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use a temporary local directory for Multer
        const tempUploadsDir = path.join(__dirname, '../temp_uploads');
        if (!fs.existsSync(tempUploadsDir)) { // Ensure temp directory exists
            fs.mkdirSync(tempUploadsDir);
        }
        cb(null, tempUploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});


// Multer file filter (remains the same)
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
    storage: tempStorage, // Use temporary disk storage
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB file size limit
    fileFilter: fileFilter
});

// Custom middleware to upload from Multer's temporary storage to Azure Blob
const uploadToAzureBlob = (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next(); // No file to upload
    }

    const filesToProcess = req.file ? [req.file] : req.files.flatMap(f => f); // Handle single/multiple files

    Promise.all(filesToProcess.map(async (file) => {
        try {
            // Read the file from temporary disk storage
            const buffer = fs.readFileSync(file.path);
            const blobUrl = await uploadFileToBlob(
                file.path, // Temporary path
                file.filename, // Name to use in blob storage
                buffer,
                file.mimetype
            );
            file.azureBlobUrl = blobUrl; // Attach blob URL to file object

            // Clean up local temporary file
            fs.unlinkSync(file.path);
        } catch (error) {
            console.error(`Error uploading ${file.filename} to Azure Blob:`, error);
            throw new Error(`Failed to upload ${file.originalname} to Azure Blob`);
        }
    }))
    .then(() => next())
    .catch(error => {
        res.status(500).send(error.message);
    });
};


module.exports = {
    upload, // Multer instance
    uploadToAzureBlob // Custom middleware for blob upload
};