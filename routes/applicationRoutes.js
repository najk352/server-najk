// C:\Users\Pharmacy\Desktop\jobportal-mern\server\routes\applicationRoutes.js
const express = require('express');
const { submitApplication, getMyApplications, getApplicationById } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary } = require('../middleware/uploadMiddleware'); // <--- UPDATED: Import both Multer and Cloudinary middleware
const router = express.Router();

// Fields for file uploads in the multi-step application form
const uploadFields = [
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'passportCopy', maxCount: 1 },
    { name: 'goodConductCertificate', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
];

// Route for job seekers to submit a new application
// Uses Multer to parse files, then Cloudinary middleware to upload them
router.post('/:jobId', protect, upload.fields(uploadFields), uploadToCloudinary, submitApplication); // <--- UPDATED
router.get('/my-applications', protect, getMyApplications); // Job seeker views their own applications
router.get('/:id', protect, getApplicationById); // View a single application (applicant or admin)

module.exports = router;