const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User'); // Still imported, not directly used in these specific functions
// const fs = require('fs'); // Not needed if file handling is purely via Cloudinary
// const path = require('path'); // Not needed if file handling is purely via Cloudinary


// @desc    Submit a new job application
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker)
const submitApplication = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const {
        firstName, lastName, email, phoneNumber, idNumber,
        passportNumber, passportExpiryDate
    } = req.body;

    // Ensure user is a job seeker
    if (req.user.role !== 'job_seeker') {
        res.status(403);
        throw new Error('Only job seekers can submit applications');
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    // Check if application already exists for this user and job
    const existingApplication = await Application.findOne({
        job: jobId,
        applicant: req.user.id
    });
    if (existingApplication) {
        res.status(400);
        throw new Error('You have already applied for this job');
    }

    // Handle file uploads (Multer attaches processed files to req.files with .cloudinaryUrl)
    const uploadedFiles = {};
    if (req.files) {
        req.files.forEach(file => {
            // Store the Cloudinary URL in the database
            uploadedFiles[file.fieldname] = file.cloudinaryUrl;
        });
    }

    const application = await Application.create({
        job: jobId,
        applicant: req.user.id,
        firstName, lastName, email, phoneNumber, idNumber,
        passportNumber: passportNumber || null,
        passportExpiryDate: passportExpiryDate || null,
        ...uploadedFiles, // Spread the Cloudinary URLs into the application document
        status: 'pending'
    });

    if (application) {
        res.status(201).json(application);
    } else {
        res.status(400);
        throw new Error('Could not submit application');
    }
});

// @desc    Get all applications for the current job seeker
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker)
const getMyApplications = asyncHandler(async (req, res) => {
    if (req.user.role !== 'job_seeker') {
        res.status(403);
        throw new Error('Only job seekers can view their applications');
    }

    const applications = await Application.find({ applicant: req.user.id }).populate('job', 'title company location');

    // It's a good practice to consistently wrap arrays in objects for API responses
    res.status(200).json({ data: applications, total: applications.length });
});

// @desc    Get a single application by ID
// @route   GET /api/applications/:id
// @access  Private (Job Seeker - own application) or Admin (any application)
const getApplicationById = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id).populate('job', 'title company location').populate('applicant', 'email');

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    // Only allow applicant or admin to view
    if (req.user.role === 'admin' || application.applicant.toString() === req.user.id.toString()) {
        res.status(200).json(application);
    } else {
        res.status(403);
        throw new Error('Not authorized to view this application');
    }
});


module.exports = {
    submitApplication,
    getMyApplications,
    getApplicationById,
};