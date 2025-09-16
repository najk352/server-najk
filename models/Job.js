// server/models/Job.js
const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a job title']
    },
    company: {
        type: String,
        required: [true, 'Please add a company name']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    description: {
        type: String,
        required: [true, 'Please add a job description']
    },
    requirements: {
        type: String,
        required: [true, 'Please add job requirements']
    },
    salary: {
        type: String,
        default: 'Negotiable'
    },
    applicationDeadline: {
        type: Date,
        required: [true, 'Please add an application deadline']
    },
    poster: { // NEW FIELD ADDED HERE
        type: String, // Stores the path to the uploaded image
    },
    postedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);