const express = require('express');
const https = require('https');
const nodemailer = require('nodemailer');
const multer = require('multer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const contactRoutes = require('./routes/contactRoutes');
//const server =http.createServer();

dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Twilio Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'Loaded' : 'Missing');
console.log('Twilio Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'Loaded' : 'Missing');
console.log('Twilio Phone Number:', process.env.TWILIO_PHONE_NUMBER || 'Missing');
console.log('Target Phone:', process.env.TARGET_PHONE_NUMBER || 'Missing');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/contact', contactRoutes);

// Helper function to get content type - MOVED BEFORE IT'S USED
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[ext] || 'application/octet-stream';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a safe filename
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOC files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// SIMPLIFIED Email configuration - Direct transporter creation
const createEmailTransporter = () => {
    try {
        console.log('📧 Creating email transporter...');
        console.log('Email config:', {
            user: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASS
        });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials missing');
            return null;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log('✅ Email transporter created successfully');
        return transporter;
    } catch (error) {
        console.error('❌ Error creating email transporter:', error);
        return null;
    }
};
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Application submission endpoint
app.post('/submit-application', upload.single('resume'), async (req, res) => {
    let fileCleanupRequired = false; // FIXED: Correct variable name
    let filePath = null;
    try {
        console.log('🎯 Career application endpoint hit');
        console.log('Request body:', req.body);
        console.log('Uploaded file:', req.file);


        const { fullName, phoneNumber, email, position, coverLetter } = req.body;

        if (!fullName || !email || !coverLetter) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and cover letter are required'
            });
        }
        console.log('✅ Form validation passed');

        // Create email transporter
        const transporter = createEmailTransporter();
        if (!transporter) {
            return res.status(500).json({
                success: false,
                message: 'Email service not configured. Please try again later.'
            });
        }

        // Prepare attachments
        const attachments = [];
        if (req.file) {
            filePath = req.file.path;
            fileCleanupRequired = true;

            // Verify file exists
            if (!fs.existsSync(filePath)) {
                console.error('File not found:', filePath);
                return res.status(400).json({
                    success: false,
                    message: 'File upload failed. Please try again.'
                });
            }
            console.log('✅ File found, preparing attachment');
            // Use file buffer for attachment
            const fileBuffer = fs.readFileSync(filePath);
            attachments.push({
                filename: req.file.originalname,
                content: fileBuffer,
                contentType: getContentType(req.file.originalname)
            });
        }

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'mpbharathi18@gmail.com',
            subject: `Job Application: ${position} - ${fullName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Job Application</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #555;">Applicant Details:</h3>
            <p><strong>Full Name:</strong> ${fullName}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber || 'Not provided'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Position Applied For:</strong> ${position || 'Not specified'}</p>
          </div>
          <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; margin-top: 15px;">
            <h3 style="color: #555;">Cover Letter:</h3>
            <p style="white-space: pre-wrap;">${coverLetter}</p>
          </div>
          ${req.file ? `<p style="margin-top: 15px;"><strong>Resume:</strong> ${req.file.filename}</p>` : ''}
        </div>
      `,
            attachments: req.file ? [
                {
                    filename: req.file.originalname,
                    path: req.file.path
                }
            ] : []
        };

        console.log('📧 Sending email...');

        // Verify transporter has sendMail method
        if (typeof transporter.sendMail !== 'function') {
            console.error('❌ transporter.sendMail is not a function');
            console.log('Transporter object:', transporter);
            throw new Error('Email service configuration error');
        }

        // Send email
        // await transporter.sendMail(mailOptions);
        //console.log('✅ Email sent successfully with attachment');

        // Send email
        const emailResult = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Email response:', emailResult.response);

        // Clean up file after successful email
        if (fileCleanupRequired && filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            fileCleanupRequired = false;
            console.log('✅ Temporary file cleaned up');
        }

        console.log('✅ Application processed successfully');

        res.status(200).json({
            success: true,
            message: 'Application submitted successfully!'
        });

    } catch (error) {
        console.error('Error submitting application:', error);

        // Clean up file on error
        if (fileCleanupRequired && filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }


        res.status(500).json({
            success: false,
            message: 'Failed to submit application. Please try again.'
        });
    }
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});


// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Career Opportunities API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test the API: http://localhost:${PORT}/api/contact`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`📧 Career applications: http://localhost:${PORT}/submit-application`);
    console.log(`📧 Test email: http://localhost:${PORT}/test-email`);
});