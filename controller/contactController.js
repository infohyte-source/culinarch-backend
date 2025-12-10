const axios = require("axios");

const sendContactEmail = async (req, res) => {
    try {
        const { name, mobileNumber, message } = req.body;

        if (!name || !mobileNumber || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const mailData = {
            personalizations: [
                {
                    to: [{ email: process.env.TO_EMAIL }],
                },
            ],
            from: { email: process.env.FROM_EMAIL },
            subject: `New Contact Form Submission from ${name}`,
            content: [
                {
                    type: "text/html",
                    value: `
                        <h2>New Contact Message</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    `,
                },
            ],
        };

        const response = await axios.post(
            "https://api.sendgrid.com/v3/mail/send",
            mailData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("SendGrid Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to send email.",
        });
    }
};

module.exports = { sendContactEmail };
