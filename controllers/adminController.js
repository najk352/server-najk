// server/controllers/adminController.js
const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const User = require('../models/User'); // Not directly used in these functions but imported
const Application = require('../models/Application'); // Not directly used in these functions but imported
const path = require('path');
const fs = require('fs');

// @desc    Create a new job posting
// @route   POST /api/admin/jobs
// @access  Private (Admin)
const createJob = asyncHandler(async (req, res) => {
    const { title, company, location, description, requirements, salary, applicationDeadline } = req.body;
    // Multer + Azure middleware adds file info to req.file
    const posterBlobUrl = req.file?.azureBlobUrl || null;

    if (!title || !company || !location || !description || !requirements || !applicationDeadline) {
        res.status(400);
        throw new Error('Please fill all required job fields');
    }

    const job = await Job.create({
        title, company, location, description, requirements, salary, applicationDeadline,
        poster: posterBlobUrl, // Save the Blob URL
        postedBy: req.user.id
    });

    res.status(201).json(job);
});

// @desc    Update a job posting
// @route   PUT /api/admin/jobs/:id
// @access  Private (Admin)
const updateJob = asyncHandler(async (req, res) => {
    const { title, company, location, description, requirements, salary, applicationDeadline } = req.body;
    const job = await Job.findById(req.params.id);
    const newPosterBlobUrl = req.file?.azureBlobUrl || null;

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    // If a new poster is uploaded, update the Blob URL
    if (newPosterBlobUrl) {
        job.poster = newPosterBlobUrl;
    }

    job.title = title || job.title;
    job.company = company || job.company;
    job.location = location || job.location;
    job.description = description || job.description;
    job.requirements = requirements || job.requirements;
    job.salary = salary || job.salary;
    job.applicationDeadline = applicationDeadline || job.applicationDeadline;

    const updatedJob = await job.save();
    res.status(200).json(updatedJob);
});

// @desc    Delete a job posting
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }
    // Optionally: delete the associated blob from Azure if needed (not implemented here)

    await job.deleteOne();
    res.status(200).json({ message: 'Job removed' });
});


// ... (rest of adminController.js functions: getAllApplications, getApplicationDetail, updateApplicationStatus, downloadDocument) ...

// NOTE: Ensure your existing controller functions are still included here.
// I am omitting them for brevity in this response, but make sure they remain in your file.
const getAllApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find()
        .populate('job', 'title company location')
        .populate('applicant', 'email');
    res.status(200).json(applications);
});

const getApplicationDetail = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id)
        .populate('job', 'title company location')
        .populate('applicant', 'email firstName lastName');
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }
    res.status(200).json(application);
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }
    application.status = status || application.status;
    application.adminNotes = adminNotes || application.adminNotes;
    const updatedApplication = await application.save();
    res.status(200).json(updatedApplication);
});

const downloadDocument = asyncHandler(async (req, res) => {
    const { id, documentType } = req.params;
    const application = await Application.findById(id);
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }
    const filePath = application[documentType];
    if (!filePath) {
        res.status(404);
        throw new Error('Document not found for this type');
    }
    if (!filePath.startsWith('/uploads/')) {
        res.status(400);
        throw new Error('Invalid file path stored');
    }
    const fileName = path.basename(filePath);
    const fullPath = path.join(__dirname, '..', 'uploads', fileName);
    if (fs.existsSync(fullPath)) {
        res.download(fullPath, fileName);
    } else {
        res.status(404);
        throw new Error('File not found on server');
    }
});


module.exports = {
    createJob,
    updateJob,
    deleteJob,
    getAllApplications,
    getApplicationDetail,
    updateApplicationStatus,
    downloadDocument,
};