// server/routes/adminRoutes.js
const express = require('express');
const {
    createJob, updateJob, deleteJob,
    getAllApplications, getApplicationDetail, updateApplicationStatus,
    downloadDocument
} = require('../controllers/adminController');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const { upload, uploadToAzureBlob } = require('../middleware/uploadMiddleware'); // Import Multer & Azure Blob middleware
const router = express.Router();

// Job Management (Admin only)
// Add upload.single('poster') and uploadToAzureBlob middleware for routes that handle poster images
router.post('/jobs', protect, authorizeAdmin, upload.single('poster'), uploadToAzureBlob, createJob);
router.put('/jobs/:id', protect, authorizeAdmin, upload.single('poster'), uploadToAzureBlob, updateJob);
router.delete('/jobs/:id', protect, authorizeAdmin, deleteJob);

// Application Management (Admin only)
router.get('/applications', protect, authorizeAdmin, getAllApplications);
router.get('/applications/:id', protect, authorizeAdmin, getApplicationDetail);
router.put('/applications/:id/status', protect, authorizeAdmin, updateApplicationStatus);
router.get('/applications/:id/download/:documentType', protect, authorizeAdmin, downloadDocument);


module.exports = router;