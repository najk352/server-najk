const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Submit a new job application
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker)
const submitApplication = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const {
        firstName, lastName, email, phoneNumber, idNumber,
        passportNumber, passportExpiryDate
    } = req.body;

    if (req.user.role !== 'job_seeker') {
        res.status(403);
        throw new Error('Only job seekers can submit applications');
    }

    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    const existingApplication = await Application.findOne({
        job: jobId,
        applicant: req.user.id
    });
    if (existingApplication) {
        res.status(400);
        throw new Error('You have already applied for this job');
    }

    // Handle file uploads (Multer + Azure Blob adds azureBlobUrl to each file)
    const uploadedFiles = {};
    if (req.files) {
        // Multer can provide files as an object or array
        if (Array.isArray(req.files)) {
            req.files.forEach(file => {
                uploadedFiles[file.fieldname] = file.azureBlobUrl || null;
            });
        } else {
            Object.keys(req.files).forEach(field => {
                const file = req.files[field][0];
                uploadedFiles[field] = file.azureBlobUrl || null;
            });
        }
    }

    const application = await Application.create({
        job: jobId,
        applicant: req.user.id,
        firstName, lastName, email, phoneNumber, idNumber,
        passportNumber: passportNumber || null,
        passportExpiryDate: passportExpiryDate || null,
        ...uploadedFiles,
        status: 'pending'
    });

    if (application) {
        res.status(201).json(application.toJSON());
    } else {
        res.status(400);
        throw new Error('Could not submit application');
    }
});

// @desc    Get all applications for the current job seeker (paginated)
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker)
const getMyApplications = asyncHandler(async (req, res) => {
    if (req.user.role !== 'job_seeker') {
        res.status(403);
        throw new Error('Only job seekers can view their applications');
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const count = await Application.countDocuments({ applicant: req.user.id });
    const applications = await Application.find({ applicant: req.user.id })
        .populate('job', 'title company location')
        .sort({ createdAt: -1 })
        .skip(pageSize * (page - 1))
        .limit(pageSize);
    res.status(200).json({
        applications: applications.map(app => app.toJSON()),
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// @desc    Get a single application by ID
// @route   GET /api/applications/:id
// @access  Private (Job Seeker - own application) or Admin (any application)
const getApplicationById = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id)
        .populate('job', 'title company location')
        .populate('applicant', 'email');
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }
    if (req.user.role === 'admin' || application.applicant._id.toString() === req.user.id.toString()) {
        res.status(200).json(application.toJSON());
    } else {
        res.status(403);
        throw new Error('Not authorized to view this application');
    }
});

// @desc    Admin: Get all applications (paginated)
// @route   GET /api/applications
// @access  Private/Admin
const getAllApplications = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Only admins can view all applications');
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const count = await Application.countDocuments();
    const applications = await Application.find()
        .populate('job', 'title company location')
        .populate('applicant', 'email')
        .sort({ createdAt: -1 })
        .skip(pageSize * (page - 1))
        .limit(pageSize);
    res.status(200).json({
        applications: applications.map(app => app.toJSON()),
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// @desc    Admin: Update application status/notes
// @route   PUT /api/applications/:id
// @access  Private/Admin
const updateApplication = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Only admins can update applications');
    }
    const application = await Application.findById(req.params.id);
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }
    const { status, adminNotes } = req.body;
    if (status) application.status = status;
    if (adminNotes) application.adminNotes = adminNotes;
    const updatedApp = await application.save();
    res.status(200).json(updatedApp.toJSON());
});

module.exports = {
    submitApplication,
    getMyApplications,
    getApplicationById,
    getAllApplications,
    updateApplication,
};

