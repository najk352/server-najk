const express = require('express');
const { submitApplication, getMyApplications, getApplicationById, getAllApplications, updateApplication } = require('../controllers/applicationController');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const { upload, uploadToAzureBlob } = require('../middleware/uploadMiddleware');
const router = express.Router();

// Fields for file uploads in the multi-step form
const uploadFields = [
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'passportCopy', maxCount: 1 },
    { name: 'goodConductCertificate', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
];

// Job seeker routes
router.post('/:jobId', protect, upload.fields(uploadFields), uploadToAzureBlob, submitApplication);
router.get('/my-applications', protect, getMyApplications);
router.get('/:id', protect, getApplicationById); // Accessible by applicant or admin

// Admin routes
router.get('/', protect, authorizeAdmin, getAllApplications);
router.put('/:id', protect, authorizeAdmin, updateApplication);

module.exports = router;
