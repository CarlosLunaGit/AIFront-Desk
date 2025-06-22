// Service Provider Strategy Configuration
export interface ServiceProviderConfig {
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    isShared: boolean; // true = your account, false = customer's account
  };
  stripe?: {
    secretKey: string;
    accountId?: string; // For Stripe Connect
    isConnect: boolean; // true = customer's account via Connect
  };
  openai?: {
    apiKey: string;
    organizationId?: string;
    isShared: boolean;
  };
}

export interface HotelSubscription {
  plan: 'starter' | 'professional' | 'enterprise';
  features: {
    ownTwilioAccount: boolean;
    ownEmailService: boolean;
    customBranding: boolean;
    dedicatedSupport: boolean;
  };
  usage: {
    messagesIncluded: number;
    messagesUsed: number;
    emailsIncluded: number;
    emailsUsed: number;
  };
  billing: {
    monthlyFee: number;
    overageRates: {
      perMessage: number;
      perEmail: number;
    };
  };
}

export class ServiceProviderFactory {
  static createTwilioService(hotel: any): any {
    const subscription = hotel.subscription as HotelSubscription;
    
    if (subscription.features.ownTwilioAccount && hotel.credentials?.twilio) {
      // Use customer's Twilio account
      return new TwilioService({
        accountSid: hotel.credentials.twilio.accountSid,
        authToken: hotel.credentials.twilio.authToken,
        phoneNumber: hotel.credentials.twilio.phoneNumber,
        isShared: false
      });
    } else {
      // Use shared/platform Twilio account
      return new TwilioService({
        accountSid: process.env.PLATFORM_TWILIO_ACCOUNT_SID!,
        authToken: process.env.PLATFORM_TWILIO_AUTH_TOKEN!,
        phoneNumber: process.env.PLATFORM_TWILIO_PHONE_NUMBER!,
        isShared: true
      });
    }
  }

  static createStripeService(hotel: any): any {
    // Stripe always uses customer's account via Connect
    if (!hotel.credentials?.stripe?.accountId) {
      throw new Error('Customer must connect their Stripe account');
    }

    return new StripeService({
      secretKey: process.env.STRIPE_SECRET_KEY!,
      accountId: hotel.credentials.stripe.accountId,
      isConnect: true
    });
  }

  static createOpenAIService(hotel: any): any {
    // Always use platform account with usage tracking
    return new OpenAIService({
      apiKey: process.env.PLATFORM_OPENAI_API_KEY!,
      organizationId: process.env.PLATFORM_OPENAI_ORG_ID,
      hotelId: hotel._id.toString(),
      isShared: true
    });
  }
} 