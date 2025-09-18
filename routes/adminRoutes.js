// C:\Users\Pharmacy\Desktop\jobportal-mern\server\routes\adminRoutes.js
const express = require('express');
const {
    createJob, updateJob, deleteJob,
    getAllApplications, getApplicationDetail, updateApplicationStatus,
    downloadDocument, // Also part of admin controller
    getContactMessages, updateContactMessageReadStatus // From contactController, now in adminController
} = require('../controllers/adminController'); // All admin functions now consolidated here
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary } = require('../middleware/uploadMiddleware'); // <--- UPDATED: Import both Multer and Cloudinary middleware
const router = express.Router();

// --- Job Management (Admin only) ---
// Add upload.single('poster') and uploadToCloudinary middleware for routes that handle poster images
router.post('/jobs', protect, authorizeAdmin, upload.single('poster'), uploadToCloudinary, createJob); // <--- UPDATED
router.put('/jobs/:id', protect, authorizeAdmin, upload.single('poster'), uploadToCloudinary, updateJob); // <--- UPDATED
router.delete('/jobs/:id', protect, authorizeAdmin, deleteJob);

// --- Application Management (Admin only) ---
router.get('/applications', protect, authorizeAdmin, getAllApplications);
router.get('/applications/:id', protect, authorizeAdmin, getApplicationDetail);
router.put('/applications/:id/status', protect, authorizeAdmin, updateApplicationStatus);
// For downloading documents, it's a redirect to Cloudinary, so it's a GET request
router.get('/applications/:id/download/:documentType', protect, authorizeAdmin, downloadDocument);

// --- Contact Message Management (Admin only) ---
// Note: These routes are for admin access to messages, using adminController functions.
// The public POST /api/contact is in contactRoutes.js
router.get('/contact-messages', protect, authorizeAdmin, getContactMessages);
router.put('/contact-messages/:id/read', protect, authorizeAdmin, updateContactMessageReadStatus);

module.exports = router;