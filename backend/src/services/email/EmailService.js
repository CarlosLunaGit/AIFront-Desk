"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../../utils/logger");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    sendReservationConfirmation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const emailTemplate = this.generateConfirmationEmail(data);
                const mailOptions = {
                    from: `"${data.hotelName}" <${process.env.SMTP_USER}>`,
                    to: data.guestEmail,
                    subject: `Reservation Confirmed - ${data.hotelName}`,
                    html: emailTemplate,
                    text: this.generatePlainTextConfirmation(data)
                };
                const result = yield this.transporter.sendMail(mailOptions);
                logger_1.logger.info('Confirmation email sent:', {
                    messageId: result.messageId,
                    to: data.guestEmail,
                    confirmationNumber: data.confirmationNumber
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('Email sending error:', error);
                return false;
            }
        });
    }
    generateConfirmationEmail(data) {
        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reservation Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .confirmation-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .total { background: #e9ecef; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none; }
            .button { display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Reservation Confirmed!</h1>
            <h2>${data.hotelName}</h2>
        </div>
        
        <div class="content">
            <div class="confirmation-box">
                <h3>Dear ${data.guestName},</h3>
                <p>Thank you for choosing ${data.hotelName}! Your reservation has been confirmed and your credit card has been authorized.</p>
                <p><strong>Confirmation Number: ${data.confirmationNumber}</strong></p>
            </div>

            <h3>Reservation Details</h3>
            <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span>${data.checkIn}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span>${data.checkOut}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Guests:</span>
                <span>${data.guests}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Authorization ID:</span>
                <span>${data.paymentAuthId}</span>
            </div>
            
            <div class="total">
                <div class="detail-row" style="border: none; font-size: 18px;">
                    <span>Total Amount:</span>
                    <span>$${data.totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <h3>Important Information</h3>
            <ul>
                <li><strong>Payment:</strong> Your credit card has been authorized but not charged. Payment will be collected upon check-in.</li>
                <li><strong>Check-in time:</strong> 3:00 PM</li>
                <li><strong>Check-out time:</strong> 11:00 AM</li>
                <li><strong>Cancellation:</strong> Free cancellation up to 24 hours before check-in</li>
            </ul>

            <h3>Need to make changes?</h3>
            <p>If you need to modify or cancel your reservation, please contact us as soon as possible.</p>
        </div>

        <div class="footer">
            <p>Thank you for choosing ${data.hotelName}!</p>
            <p>We look forward to hosting you.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
                This is an automated confirmation email. Please save this for your records.
            </p>
        </div>
    </body>
    </html>
    `;
    }
    generatePlainTextConfirmation(data) {
        return `
RESERVATION CONFIRMED - ${data.hotelName}

Dear ${data.guestName},

Thank you for choosing ${data.hotelName}! Your reservation has been confirmed.

Confirmation Number: ${data.confirmationNumber}

Reservation Details:
- Check-in: ${data.checkIn}
- Check-out: ${data.checkOut}
- Guests: ${data.guests}
- Total Amount: $${data.totalPrice.toFixed(2)}
- Authorization ID: ${data.paymentAuthId}

Important Information:
- Your credit card has been authorized but not charged
- Payment will be collected upon check-in
- Check-in time: 3:00 PM
- Check-out time: 11:00 AM
- Free cancellation up to 24 hours before check-in

We look forward to hosting you!

${data.hotelName}
    `;
    }
    sendEmail(to, subject, html, text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to,
                    subject,
                    html,
                    text
                };
                const result = yield this.transporter.sendMail(mailOptions);
                logger_1.logger.info('Email sent:', {
                    messageId: result.messageId,
                    to,
                    subject
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('Email sending error:', error);
                return false;
            }
        });
    }
}
exports.EmailService = EmailService;
