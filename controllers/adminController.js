const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const User = require('../models/User'); // Still imported, not directly used in these specific functions
const Application = require('../models/Application'); // Still imported, not directly used in these specific functions
const ContactMessage = require('../models/ContactMessage'); // NEW: Import ContactMessage model
const cloudinary = require('../config/cloudinary'); // NEW: Import Cloudinary config
// The 'path' and 'fs' modules are no longer directly needed in this controller
// as file operations are handled by Multer (temp storage) and Cloudinary.
// const path = require('path');
// const fs = require('fs');


// @desc    Create a new job posting
// @route   POST /api/admin/jobs
// @access  Private (Admin)
const createJob = asyncHandler(async (req, res) => {
    const { title, company, location, description, requirements, salary, applicationDeadline } = req.body;
    // Cloudinary URL is attached to req.file by uploadToCloudinary middleware
    const posterCloudinaryUrl = req.file ? req.file.cloudinaryUrl : null;

    if (!title || !company || !location || !description || !requirements || !applicationDeadline) {
        res.status(400);
        throw new Error('Please fill all required job fields');
    }

    const job = await Job.create({
        title, company, location, description, requirements, salary, applicationDeadline,
        poster: posterCloudinaryUrl, // Save the Cloudinary URL
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
    const newPosterCloudinaryUrl = req.file ? req.file.cloudinaryUrl : null;

    if (!job) {
        res.status(404);
        throw new Error('Job not found'); // Corrected typo from previous
    }

    // If a new poster is uploaded, update the path and delete old one from Cloudinary
    if (newPosterCloudinaryUrl) {
        if (job.poster) { // If there's an existing poster
            try {
                // Extract public_id from the Cloudinary URL. Assumes Cloudinary folder structure.
                // Example URL: https://res.cloudinary.com/dxyz-example/image/upload/v12345/najah_jobportal/poster-12345.png
                const urlParts = job.poster.split('/');
                const folderAndPublicId = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1].split('.')[0]; // e.g., "najah_jobportal/poster-12345"
                
                await cloudinary.uploader.destroy(folderAndPublicId); // Delete from Cloudinary folder
                console.log(`Deleted old Cloudinary poster: ${folderAndPublicId}`);
            } catch (cloudinaryErr) {
                console.warn(`Failed to delete old Cloudinary asset for job ${job._id}:`, cloudinaryErr.message);
            }
        }
        job.poster = newPosterCloudinaryUrl; // Update with new Cloudinary URL
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
    // Delete associated poster from Cloudinary
    if (job.poster) { // If there's a poster
        try {
            // Extract public_id from the Cloudinary URL.
            const urlParts = job.poster.split('/');
            const folderAndPublicId = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1].split('.')[0];
            
            await cloudinary.uploader.destroy(folderAndPublicId);
            console.log(`Deleted Cloudinary asset on job delete: ${folderAndPublicId}`);
        } catch (cloudinaryErr) {
            console.warn(`Failed to delete Cloudinary asset for job ${job._id} during deletion:`, cloudinaryErr.message);
        }
    }

    await job.deleteOne();
    res.status(200).json({ message: 'Job removed' });
});


// @desc    Get all job applications
// @route   GET /api/admin/applications
// @access  Private (Admin)
const getAllApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find()
        .populate('job', 'title company location')
        .populate('applicant', 'email');
    res.status(200).json({ data: applications, total: applications.length }); // Return as object with 'data' key for frontend parsing
});

// @desc    Get a specific job application by ID
// @route   GET /api/admin/applications/:id
// @access  Private (Admin)
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


// @desc    Update application status
// @route   PUT /api/admin/applications/:id/status
// @access  Private (Admin)
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

// @desc    Download an uploaded document (redirect to Cloudinary URL)
// @route   GET /api/admin/applications/:id/download/:documentType
// @access  Private (Admin)
const downloadDocument = asyncHandler(async (req, res) => {
    const { id, documentType } = req.params;

    const application = await Application.findById(id);
    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    const fileUrl = application[documentType]; // This is now a Cloudinary URL

    if (!fileUrl) {
        res.status(404);
        throw new Error('Document not found for this type');
    }

    // Redirect to the Cloudinary URL for download.
    // Cloudinary usually handles 'Content-Disposition' header to suggest a download filename.
    res.redirect(fileUrl);
});


// --- Contact Message Management (Admin only) ---
// @desc    Get all contact messages
// @route   GET /api/contact/admin/contact-messages
// @access  Private (Admin)
const getContactMessages = asyncHandler(async (req, res) => {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
});

// @desc    Mark a contact message as read/unread
// @route   PUT /api/contact/admin/contact-messages/:id/read
// @access  Private (Admin)
const updateContactMessageReadStatus = asyncHandler(async (req, res) => {
    const { read } = req.body; // Expects { read: true/false }

    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
        res.status(404);
        throw new Error('Contact message not found');
    }

    message.read = read !== undefined ? read : !message.read; // Toggle or set
    await message.save();
    res.status(200).json({ success: true, data: message });
});


module.exports = {
    createJob,
    updateJob,
    deleteJob,
    getAllApplications,
    getApplicationDetail,
    updateApplicationStatus,
    downloadDocument,
    // NEW: Export contact message functions
    getContactMessages,
    updateContactMessageReadStatus
};