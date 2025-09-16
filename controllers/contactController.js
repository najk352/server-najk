const asyncHandler = require('express-async-handler');
const ContactMessage = require('../models/ContactMessage');

// @desc    Submit a new contact message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        res.status(400);
        throw new Error('Please fill all contact form fields');
    }

    const newMessage = await ContactMessage.create({
        name, email, subject, message
    });

    res.status(201).json({ success: true, data: newMessage });
});

// @desc    Get all contact messages (Admin only)
// @route   GET /api/admin/contact-messages
// @access  Private (Admin)
const getContactMessages = asyncHandler(async (req, res) => {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
});

// @desc    Mark a contact message as read/unread (Admin only)
// @route   PUT /api/admin/contact-messages/:id/read
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
    submitContactMessage,
    getContactMessages,
    updateContactMessageReadStatus
};