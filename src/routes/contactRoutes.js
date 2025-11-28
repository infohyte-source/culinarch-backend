const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');



// Handle call back request
router.post('/call-back', async (req, res) => {
    try {
        const { name, contactNumber, message } = req.body;

        // Validate required fields
        if (!name || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Name and contact number are required'
            });
        }
        

        // Send SMS to target number
        const smsMessage = smsService.formatCallBackMessage({ name, contactNumber, message });
        const smsResult = await smsService.sendSMS(process.env.TARGET_PHONE_NUMBER, smsMessage);

        if (!smsResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send SMS notification'
            });
        }

        // Send confirmation to user
        await smsService.sendConfirmation(contactNumber, name);

        res.json({
            success: true,
            message: 'Call back request submitted successfully! We will contact you soon.'
        });

    } catch (error) {
        console.error('Error in call back request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Handle message us request
router.post('/message-us', async (req, res) => {
    try {
        const { name, contactNumber, message } = req.body;

        // Validate required fields
        if (!name || !contactNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, contact number, and message are required'
            });
        }

        // Send SMS to target number
        const smsMessage = smsService.formatGeneralMessage({ name, contactNumber, message });
        const smsResult = await smsService.sendSMS(process.env.TARGET_PHONE_NUMBER, smsMessage);

        if (!smsResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send message'
            });
        }

        res.json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Error in message us request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;