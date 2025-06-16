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
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
});
// Get subscription plans
router.get('/plans', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = [
            {
                id: 'basic',
                name: 'Basic',
                price: 29,
                features: [
                    'Up to 50 rooms',
                    'Basic AI responses',
                    'WhatsApp integration',
                    'Email support'
                ],
                limits: {
                    rooms: 50,
                    aiResponses: 1000,
                    channels: ['whatsapp']
                }
            },
            {
                id: 'professional',
                name: 'Professional',
                price: 99,
                features: [
                    'Up to 200 rooms',
                    'Advanced AI responses',
                    'Multi-channel communication',
                    'Priority support',
                    'Analytics dashboard'
                ],
                limits: {
                    rooms: 200,
                    aiResponses: 5000,
                    channels: ['whatsapp', 'email', 'sms']
                }
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 299,
                features: [
                    'Unlimited rooms',
                    'Custom AI training',
                    'All communication channels',
                    '24/7 phone support',
                    'Custom integrations',
                    'White-label solution'
                ],
                limits: {
                    rooms: -1, // unlimited
                    aiResponses: -1, // unlimited
                    channels: ['whatsapp', 'email', 'sms', 'phone']
                }
            }
        ];
        res.json(plans);
    }
    catch (error) {
        logger_1.logger.error('Error fetching subscription plans:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Create subscription
router.post('/create', [
    (0, express_validator_1.body)('planId').isIn(['basic', 'professional', 'enterprise']),
    (0, express_validator_1.body)('paymentMethodId').notEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { planId, paymentMethodId } = req.body;
        // TODO: Replace with actual user data from auth
        const userId = 'temp-user-id';
        const userEmail = 'user@example.com';
        // Create or retrieve customer
        let customer;
        try {
            const customers = yield stripe.customers.list({
                email: userEmail,
                limit: 1,
            });
            if (customers.data.length > 0) {
                customer = customers.data[0];
            }
            else {
                customer = yield stripe.customers.create({
                    email: userEmail,
                    payment_method: paymentMethodId,
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }
        }
        catch (stripeError) {
            logger_1.logger.error('Stripe customer error:', stripeError);
            return res.status(400).json({ message: 'Error creating customer' });
        }
        // Get price ID based on plan
        const priceIds = {
            basic: process.env.STRIPE_BASIC_PRICE_ID,
            professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
            enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        };
        const priceId = priceIds[planId];
        if (!priceId) {
            return res.status(400).json({ message: 'Invalid plan ID' });
        }
        // Create subscription
        try {
            const subscription = yield stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: priceId }],
                expand: ['latest_invoice.payment_intent'],
            });
            res.status(201).json({
                subscriptionId: subscription.id,
                clientSecret: (_b = (_a = subscription.latest_invoice) === null || _a === void 0 ? void 0 : _a.payment_intent) === null || _b === void 0 ? void 0 : _b.client_secret,
                status: subscription.status,
            });
        }
        catch (stripeError) {
            logger_1.logger.error('Stripe subscription error:', stripeError);
            return res.status(400).json({ message: 'Error creating subscription' });
        }
    }
    catch (error) {
        logger_1.logger.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get current subscription
router.get('/current', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Get user from auth context
        const userEmail = 'user@example.com';
        const customers = yield stripe.customers.list({
            email: userEmail,
            limit: 1,
        });
        if (customers.data.length === 0) {
            return res.json({ subscription: null });
        }
        const subscriptions = yield stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            limit: 1,
        });
        if (subscriptions.data.length === 0) {
            return res.json({ subscription: null });
        }
        const subscription = subscriptions.data[0];
        res.json({
            subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.current_period_end,
                planId: subscription.items.data[0].price.lookup_key || 'basic',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching current subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Cancel subscription
router.post('/cancel/:subscriptionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subscriptionId } = req.params;
        const subscription = yield stripe.subscriptions.cancel(subscriptionId);
        res.json({
            message: 'Subscription cancelled successfully',
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancelAt: subscription.cancel_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Webhook endpoint for Stripe events
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger_1.logger.error('Stripe webhook secret not configured');
        return res.status(400).json({ message: 'Webhook secret not configured' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        logger_1.logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }
    // Handle the event
    switch (event.type) {
        case 'invoice.payment_succeeded':
            logger_1.logger.info('Payment succeeded:', event.data.object.id);
            // TODO: Update user subscription status
            break;
        case 'invoice.payment_failed':
            logger_1.logger.warn('Payment failed:', event.data.object.id);
            // TODO: Handle failed payment
            break;
        case 'customer.subscription.deleted':
            logger_1.logger.info('Subscription deleted:', event.data.object.id);
            // TODO: Deactivate user account
            break;
        default:
            logger_1.logger.warn('Unhandled event type:', event.type);
    }
    res.json({ received: true });
});
exports.default = router;
