// C:\Users\Pharmacy\Desktop\jobportal-mern\server\routes\contactRoutes.js
const express = require('express');
const { submitContactMessage } = require('../controllers/contactController'); // Only the public function
const router = express.Router();

// Public route for submitting messages (no authentication needed for this)
router.post('/', submitContactMessage);

module.exports = router;