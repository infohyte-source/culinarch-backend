const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const contactRoutes = require("./routes/contactRoutes");

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/contact", contactRoutes);
app.use("/uploads", express.static("uploads"));

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync("uploads")) {
            fs.mkdirSync("uploads");
        }
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Career Form API
app.post("/submit-application", upload.single("resume"), async (req, res) => {
    try {
        const { fullName, email, phoneNumber, position, coverLetter } = req.body;


        if (!fullName || !email || !coverLetter) {
            return res.status(400).json({
                success: false,
                message: "Full name, email & cover letter are required."
            });
        }

        const msg = {
            to: process.env.TO_EMAIL,
            from: process.env.FROM_EMAIL,
            subject: `Job Application - ${fullName} (${position})`,
            html: `
            <h2>New Job Application</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber}</p>
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>Cover Letter:</strong></p>
            <p>${coverLetter}</p>
        `,
            attachments: req.file
                ? [
                    {
                        filename: req.file.originalname,
                        type: "application/octet-stream",
                        content: fs.readFileSync(req.file.path).toString("base64")
                    }
                ]
                : []
        };

        await sgMail.send(msg);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path); // delete file after sending mail
        }

        return res.status(200).json({
            success: true,
            message: "Application submitted successfully!"
        });
    } catch (error) {
        console.error("Career Form Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit application."
        });
    }


});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
