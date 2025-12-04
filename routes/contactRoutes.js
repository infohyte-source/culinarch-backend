const express = require('express');
const router = express.Router();
const smsService = require('../middleware/smsService');

// Add your contact routes here if needed
router.get('/', (req, res) => {
    res.json({ message: 'Contact routes are working' });
});

// Handle call back request
router.post('/callback', async (req, res) => {
    try {
        const { name, contactNumber, message } = req.body;

        console.log('📞 Received call back request:', { name, contactNumber, message });

        // Validate required fields
        if (!name || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Name and contact number are required'
            });
        }

        // Validate phone number format (Indian numbers)
        const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
        const cleanedNumber = contactNumber.replace(/[+\s-]/g, '');

        if (!phoneRegex.test(cleanedNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit Indian phone number'
            });
        }

        // Send SMS to target number
        const smsMessage = smsService.formatCallBackMessage({ name, contactNumber, message });
        const smsResult = await smsService.sendSMS(process.env.TARGET_PHONE_NUMBER, smsMessage);

        console.log('SMS Result for callback:', smsResult);

        // If SMS failed but we have fallback, still consider it success
        if (!smsResult.success && !smsResult.fallback) {
            return res.status(500).json({
                success: false,
                message: `Failed to send SMS: ${smsResult.error}`
            });
        }

        // If SMS failed but we have fallback, still consider it success
        if (smsResult.fallback) {
            console.log('📱 Using SMS fallback - callback request logged but SMS not sent');
        }

        // Send confirmation to user (optional - you can remove this if not needed)
        const confirmationResult = await smsService.sendConfirmation(contactNumber, name);
        if (confirmationResult.fallback) {
            console.log('📱 Confirmation SMS fallback - logged but not sent');
        }

        res.json({
            success: true,
            message: 'Call back request submitted successfully! We will contact you soon.',
            smsSent: !smsResult.fallback
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

        console.log('💬 Received message us request:', { name, contactNumber, message });

        // Validate required fields
        if (!name || !contactNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, contact number, and message are required'
            });
        }

        // Validate phone number format (Indian numbers)
        const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
        const cleanedNumber = contactNumber.replace(/[+\s-]/g, '');

        if (!phoneRegex.test(cleanedNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit Indian phone number'
            });
        }

        // Send SMS to target number
        const smsMessage = smsService.formatGeneralMessage({ name, contactNumber, message });
        const smsResult = await smsService.sendSMS(process.env.TARGET_PHONE_NUMBER, smsMessage);

        console.log('SMS Result for message-us:', smsResult);

        // If SMS failed but we have fallback, still consider it success
        if (!smsResult.success && !smsResult.fallback) {
            return res.status(500).json({
                success: false,
                message: `Failed to send message: ${smsResult.error}`
            });
        }

        // If SMS failed but we have fallback, still consider it success
        if (smsResult.fallback) {
            console.log('📱 Using SMS fallback - message logged but not sent');
        }

        res.json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.',
            smsSent: !smsResult.fallback
        });

    } catch (error) {
        console.error('Error in message us request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Test SMS service endpoint
router.get('/test-sms', async (req, res) => {
    try {
        console.log('🧪 Testing SMS service...');

        const testResult = await smsService.sendSMS(
            process.env.TARGET_PHONE_NUMBER,
            'Test message from Culinarchs backend - SMS service is working!'
        );

        console.log('Test SMS result:', testResult);

        res.json({
            success: true,
            message: 'SMS test completed',
            result: testResult
        });
    } catch (error) {
        console.error('Error testing SMS:', error);
        res.status(500).json({
            success: false,
            message: 'SMS test failed',
            error: error.message
        });
    }
});

module.exports = router;