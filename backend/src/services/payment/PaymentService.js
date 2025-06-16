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
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../../utils/logger");
class PaymentService {
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2024-06-20',
        });
    }
    validateCard(paymentMethod, amount, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Create payment method
                const [month, year] = paymentMethod.expiry.split('/');
                const stripePaymentMethod = yield this.stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: paymentMethod.number,
                        exp_month: parseInt(month),
                        exp_year: parseInt(`20${year}`),
                        cvc: paymentMethod.cvc,
                    },
                });
                // Create payment intent (this authorizes the card without charging)
                const paymentIntent = yield this.stripe.paymentIntents.create({
                    amount,
                    currency: 'usd',
                    payment_method: stripePaymentMethod.id,
                    confirm: true,
                    capture_method: 'manual', // This authorizes but doesn't charge
                    description: metadata.description,
                    metadata: metadata.metadata,
                    return_url: 'https://your-hotel-website.com/payment-success',
                });
                if (paymentIntent.status === 'requires_capture') {
                    logger_1.logger.info('Payment authorized successfully:', {
                        paymentIntentId: paymentIntent.id,
                        amount,
                        metadata: metadata.metadata
                    });
                    return {
                        success: true,
                        paymentMethodId: stripePaymentMethod.id,
                        authorizationId: paymentIntent.id
                    };
                }
                else {
                    logger_1.logger.warn('Payment authorization failed:', {
                        status: paymentIntent.status,
                        lastPaymentError: paymentIntent.last_payment_error
                    });
                    return {
                        success: false,
                        error: ((_a = paymentIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message) || 'Payment authorization failed'
                    };
                }
            }
            catch (error) {
                logger_1.logger.error('Stripe payment error:', error);
                return {
                    success: false,
                    error: this.getStripeErrorMessage(error)
                };
            }
        });
    }
    capturePayment(authorizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paymentIntent = yield this.stripe.paymentIntents.capture(authorizationId);
                return {
                    success: paymentIntent.status === 'succeeded',
                    authorizationId: paymentIntent.id
                };
            }
            catch (error) {
                logger_1.logger.error('Payment capture error:', error);
                return {
                    success: false,
                    error: this.getStripeErrorMessage(error)
                };
            }
        });
    }
    cancelAuthorization(authorizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.stripe.paymentIntents.cancel(authorizationId);
                return true;
            }
            catch (error) {
                logger_1.logger.error('Payment cancellation error:', error);
                return false;
            }
        });
    }
    getStripeErrorMessage(error) {
        if (error.type === 'StripeCardError') {
            return error.message;
        }
        else if (error.type === 'StripeInvalidRequestError') {
            return 'Invalid payment information provided';
        }
        else if (error.type === 'StripeAPIError') {
            return 'Payment processing temporarily unavailable';
        }
        else {
            return 'Payment processing error occurred';
        }
    }
}
exports.PaymentService = PaymentService;
