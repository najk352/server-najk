const mongoose = require('mongoose');

const contactMessageSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, match: [ /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email' ] },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false }, // For admin to mark as read
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);