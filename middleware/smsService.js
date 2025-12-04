const twilio = require('twilio');
const axios = require('axios');


class SMSService {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        if (this.initialized) return;

        console.log('🔧 Initializing Twilio client in SMS Service...');
        console.log('Twilio Config in SMS Service:', {
            accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing',
            authToken: process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing',
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing'
        });

        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.error('❌ Twilio credentials are missing in SMS Service!');
            console.log('Please check your .env file for TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
            this.client = null;
            return;
        }

        try {
            this.client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
            this.initialized = true;
            console.log('✅ Twilio client initialized successfully in SMS Service');
        } catch (error) {
            console.error('❌ Error initializing Twilio client in SMS Service:', error.message);
            this.client = null;
        }
    }

    // Format callback message
    formatCallBackMessage({ name, contactNumber, message }) {
        return `New Call Back Request:\nName: ${name}\nContact: ${contactNumber}${message ? `\nMessage: ${message}` : ''}\n\nPlease call back as soon as possible.`;
    }

    // Format general message
    formatGeneralMessage({ name, contactNumber, message }) {
        return `New Message from Website:\nName: ${name}\nContact: ${contactNumber}\nMessage: ${message}`;
    }

    // Format confirmation message
    formatConfirmationMessage(name) {
        return `Hi ${name}, thank you for contacting Culinarchs! We have received your request and will get back to you soon.`;
    }

    // Format phone number for Twilio
    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        let cleaned = phone.replace(/\D/g, '');

        // Handle Indian numbers
        if (cleaned.startsWith('91') && cleaned.length === 12) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+91${cleaned.substring(1)}`;
        } else if (cleaned.length === 10) {
            return `+91${cleaned}`;
        } else if (!cleaned.startsWith('+')) {
            return `+${cleaned}`;
        }

        return cleaned;
    }

    // Validate phone number
    isValidPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    }

    // Send SMS
    async sendSMS(to, message) {
        // Check if Twilio client is initialized
        if (!this.client) {
            console.error('❌ Twilio client not initialized - using fallback');
            // Fallback: just log the message
            console.log('📱 FALLBACK SMS NOTIFICATION:');
            console.log('To:', to);
            console.log('Message:', message);
            console.log('---');
            return { success: true, fallback: true, message: 'SMS logged (Twilio not configured)' };
        }

        try {
            // Format phone numbers
            const formattedTo = this.formatPhoneNumber(to);
            const formattedFrom = process.env.TWILIO_PHONE_NUMBER;

            console.log('📱 Attempting to send SMS via Twilio:');
            console.log('From:', formattedFrom);
            console.log('To:', formattedTo);
            console.log('Message:', message);

            // Validate phone numbers
            if (!this.isValidPhoneNumber(formattedTo)) {
                console.error('Invalid phone number format:', to);
                return { success: false, error: 'Invalid phone number format' };
            }

            // Check if client.messages exists
            if (!this.client.messages) {
                console.error('❌ this.client.messages is undefined');
                throw new Error('Twilio client not properly initialized');
            }

            const result = await this.client.messages.create({
                body: message,
                from: formattedFrom,
                to: formattedTo
            });

            console.log('✅ SMS sent successfully via Twilio!');
            console.log('Message SID:', result.sid);
            console.log('Status:', result.status);

            return { success: true, messageId: result.sid, status: result.status };
        } catch (error) {
            console.error('❌ Twilio Error:', error.message);
            console.error('Error code:', error.code);

            // Fallback: log the message
            console.log('📱 FALLBACK - SMS would be sent to:', to);
            console.log('Message:', message);

            return { success: true, fallback: true, error: error.message };
        }
    }

    // Send confirmation to user
    async sendConfirmation(contactNumber, name) {
        try {
            const message = this.formatConfirmationMessage(name);
            return await this.sendSMS(contactNumber, message);
        } catch (error) {
            console.error('Error sending confirmation:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SMSService();