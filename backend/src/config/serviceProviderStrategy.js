"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceProviderFactory = void 0;
class ServiceProviderFactory {
    static createTwilioService(tenant) {
        var _a;
        const subscription = tenant.subscription;
        if (subscription.features.ownTwilioAccount && ((_a = tenant.credentials) === null || _a === void 0 ? void 0 : _a.twilio)) {
            // Use customer's Twilio account
            return new TwilioService({
                accountSid: tenant.credentials.twilio.accountSid,
                authToken: tenant.credentials.twilio.authToken,
                phoneNumber: tenant.credentials.twilio.phoneNumber,
                isShared: false
            });
        }
        else {
            // Use shared/platform Twilio account
            return new TwilioService({
                accountSid: process.env.PLATFORM_TWILIO_ACCOUNT_SID,
                authToken: process.env.PLATFORM_TWILIO_AUTH_TOKEN,
                phoneNumber: process.env.PLATFORM_TWILIO_PHONE_NUMBER,
                isShared: true
            });
        }
    }
    static createStripeService(tenant) {
        var _a, _b;
        // Stripe always uses customer's account via Connect
        if (!((_b = (_a = tenant.credentials) === null || _a === void 0 ? void 0 : _a.stripe) === null || _b === void 0 ? void 0 : _b.accountId)) {
            throw new Error('Customer must connect their Stripe account');
        }
        return new StripeService({
            secretKey: process.env.STRIPE_SECRET_KEY,
            accountId: tenant.credentials.stripe.accountId,
            isConnect: true
        });
    }
    static createOpenAIService(tenant) {
        // Always use platform account with usage tracking
        return new OpenAIService({
            apiKey: process.env.PLATFORM_OPENAI_API_KEY,
            organizationId: process.env.PLATFORM_OPENAI_ORG_ID,
            tenantId: tenant._id.toString(),
            isShared: true
        });
    }
}
exports.ServiceProviderFactory = ServiceProviderFactory;
