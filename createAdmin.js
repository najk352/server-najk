const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Path to your User model

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) { // <--- MISSING CLOSING BRACE '}' WAS HERE
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}; // <--- MISSING CLOSING BRACE '}' WAS HERE

const createAdminUser = async (email, rawPassword) => {
    const conn = await connectDB();

    try {
        // Test bcrypt hashing function directly
        const testSalt = await bcrypt.genSalt(10);
        const testHashedPassword = await bcrypt.hash(rawPassword, testSalt);
        console.log(`--- bcryptjs test ---`);
        console.log(`Raw Password: "${rawPassword}"`);
        console.log(`Test Hashed Password: "${testHashedPassword}"`);
        console.log(`Test Compare (should be true): ${await bcrypt.compare(rawPassword, testHashedPassword)}`);
        console.log(`---------------------`);


        // Delete any existing user with this email to ensure a clean insert
        await User.deleteOne({ email });
        console.log(`Any existing user '${email}' deleted.`);

        // Hash password for actual storage
        const salt = await bcrypt.genSalt(10);
        const hashedPasswordForDB = await bcrypt.hash(rawPassword, salt);

        console.log(`--- Creating new admin user ---`);
        console.log(`Raw Password (for DB): "${rawPassword}"`);
        console.log(`Hashed Password (for DB, to match in Atlas): "${hashedPasswordForDB}"`);
        console.log(`------------------------------`);

        const adminUser = await User.create({
            email,
            password: hashedPasswordForDB, // Direct insert of already hashed password
            role: 'admin'
        });

        console.log(`New admin user '${adminUser.email}' created successfully!`);
        return adminUser;

    } catch (error) {
        console.error(`Error creating admin user: ${error.message}`);
    } finally {
        if (conn) {
            await conn.disconnect();
            console.log('MongoDB Disconnected.');
        }
    }
};

// --- Configuration for your admin user ---
const ADMIN_EMAIL = 'newadmin@najah.com'; // <--- CHOOSE A *FRESH* ADMIN EMAIL (don't reuse old one)
const ADMIN_PASSWORD = 'test1234'; // <--- CHOOSE A SIMPLE, STRONG PASSWORD

if (!ADMIN_EMAIL || ADMIN_EMAIL === 'your_admin_email@example.com') {
    console.error("Please change ADMIN_EMAIL in createAdmin.js before running!");
    process.exit(1);
}
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'your_strong_admin_password') {
    console.error("Please change ADMIN_PASSWORD in createAdmin.js before running!");
    process.exit(1);
}

createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD);