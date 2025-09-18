const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express(); // <--- app IS INITIALIZED HERE

// CORS setup
const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (documents, photos)
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (ALL ROUTES MUST BE DEFINED *AFTER* const app = express();)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes')); // <--- MOVED TO HERE (after app is defined)

// Error handling middleware (optional, but good practice)
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));