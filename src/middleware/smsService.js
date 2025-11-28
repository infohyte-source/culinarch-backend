const twilio = require('twilio');

class SMSService {
    constructor() {
        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }

    async sendSMS(to, message) {
        try {
            const result = await this.client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            console.log('SMS sent successfully:', result.sid);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    }

    // Format message for call back request
    formatCallBackMessage(formData) {
        return `Call Back Request: 
Name: ${formData.name}
Contact: ${formData.contactNumber}
Message: ${formData.message || 'No additional message'}`;
    }

    // Format message for general message
    formatGeneralMessage(formData) {
        return `New Message Received:
Name: ${formData.name}
Contact: ${formData.contactNumber}
Message: ${formData.message}`;
    }

    // Send confirmation to user
    async sendConfirmation(to, userName) {
        const message = `Hi ${userName}! Your details have been received. We will call you back soon. Thank you!`;
        return await this.sendSMS(to, message);
    }
}

module.exports = new SMSService();