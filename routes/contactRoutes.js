const express = require('express');
const { submitContactMessage, getContactMessages, updateContactMessageReadStatus } = require('../controllers/contactController');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware'); // For admin routes
const router = express.Router();

// Public route for submitting messages
router.post('/', submitContactMessage);

// Admin routes for managing messages
router.get('/admin/contact-messages', protect, authorizeAdmin, getContactMessages);
router.put('/admin/contact-messages/:id/read', protect, authorizeAdmin, updateContactMessageReadStatus);

module.exports = router;