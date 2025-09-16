const express = require('express');
const { getJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', protect, authorizeAdmin, createJob);
router.put('/:id', protect, authorizeAdmin, updateJob);
router.delete('/:id', protect, authorizeAdmin, deleteJob);

module.exports = router;