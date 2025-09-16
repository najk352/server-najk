const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema({
    job: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'interview', 'rejected', 'accepted', 'withdrawn'],
        default: 'pending'
    },
    // Step 1: Personal Details
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phoneNumber: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, trim: true },
    passportNumber: { type: String, trim: true, default: '' }, // Optional
    passportExpiryDate: { type: Date }, // Optional

    // Step 2: Upload Documents (store paths to uploaded files)
    passportPhoto: { type: String, trim: true, default: '' }, // Path to file
    idFront: { type: String, trim: true, default: '' },
    idBack: { type: String, trim: true, default: '' },
    passportCopy: { type: String, trim: true, default: '' },
    goodConductCertificate: { type: String, trim: true, default: '' },
    resume: { type: String, trim: true, default: '' },
    
    adminNotes: { type: String, trim: true, default: '' }, // For admin to add notes
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hide internal fields when converting to JSON
applicationSchema.methods.toJSON = function () {
    const obj = this.toObject();
    return obj;
};

module.exports = mongoose.model('Application', applicationSchema);

