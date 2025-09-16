const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

// @desc    Get all jobs with pagination and filtering
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = req.query.keyword ? {
        title: { $regex: req.query.keyword, $options: 'i' }
    } : {};
    const location = req.query.location ? { location: req.query.location } : {};
    const filter = { ...keyword, ...location };

    const count = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(pageSize * (page - 1))
        .limit(pageSize);

    res.status(200).json({
        jobs: jobs.map(job => job.toJSON()),
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (job) {
        res.status(200).json(job.toJSON());
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

// @desc    Create a new job (admin only)
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = asyncHandler(async (req, res) => {
    const { title, company, location, description, requirements, salary, applicationDeadline } = req.body;
    if (!title || !company || !location || !description || !requirements || !applicationDeadline) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }
    const job = new Job({
        title,
        company,
        location,
        description,
        requirements,
        salary,
        applicationDeadline,
        postedBy: req.user._id
    });
    const createdJob = await job.save();
    res.status(201).json(createdJob.toJSON());
});

// @desc    Update a job (admin only)
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to update this job');
    }
    const fields = ['title', 'company', 'location', 'description', 'requirements', 'salary', 'applicationDeadline'];
    fields.forEach(field => {
        if (req.body[field] !== undefined) job[field] = req.body[field];
    });
    const updatedJob = await job.save();
    res.status(200).json(updatedJob.toJSON());
});

// @desc    Delete a job (admin only)
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete this job');
    }
    await job.remove();
    res.status(200).json({ message: 'Job deleted successfully' });
});

module.exports = {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
};
