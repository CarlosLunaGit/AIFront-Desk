import Stripe from 'stripe';
import { logger } from '../../utils/logger';

interface PaymentMethod {
  number: string;
  expiry: string;
  cvc: string;
}

interface PaymentResult {
  success: boolean;
  paymentMethodId?: string;
  authorizationId?: string;
  error?: string;
}

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20',
    });
  }

  async validateCard(
    paymentMethod: PaymentMethod,
    amount: number,
    metadata: {
      description: string;
      metadata: Record<string, string>;
    }
  ): Promise<PaymentResult> {
    try {
      // Create payment method
      const [month, year] = paymentMethod.expiry.split('/');
      const stripePaymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentMethod.number,
          exp_month: parseInt(month),
          exp_year: parseInt(`20${year}`),
          cvc: paymentMethod.cvc,
        },
      });

      // Create payment intent (this authorizes the card without charging)
      const paymentIntent = await this.stripe.paymentIntents.create({
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
        logger.info('Payment authorized successfully:', {
          paymentIntentId: paymentIntent.id,
          amount,
          metadata: metadata.metadata
        });

        return {
          success: true,
          paymentMethodId: stripePaymentMethod.id,
          authorizationId: paymentIntent.id
        };
      } else {
        logger.warn('Payment authorization failed:', {
          status: paymentIntent.status,
          lastPaymentError: paymentIntent.last_payment_error
        });

        return {
          success: false,
          error: paymentIntent.last_payment_error?.message || 'Payment authorization failed'
        };
      }
    } catch (error: any) {
      logger.error('Stripe payment error:', error);
      
      return {
        success: false,
        error: this.getStripeErrorMessage(error)
      };
    }
  }

  async capturePayment(authorizationId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(authorizationId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        authorizationId: paymentIntent.id
      };
    } catch (error: any) {
      logger.error('Payment capture error:', error);
      return {
        success: false,
        error: this.getStripeErrorMessage(error)
      };
    }
  }

  async cancelAuthorization(authorizationId: string): Promise<boolean> {
    try {
      await this.stripe.paymentIntents.cancel(authorizationId);
      return true;
    } catch (error) {
      logger.error('Payment cancellation error:', error);
      return false;
    }
  }

  private getStripeErrorMessage(error: any): string {
    if (error.type === 'StripeCardError') {
      return error.message;
    } else if (error.type === 'StripeInvalidRequestError') {
      return 'Invalid payment information provided';
    } else if (error.type === 'StripeAPIError') {
      return 'Payment processing temporarily unavailable';
    } else {
      return 'Payment processing error occurred';
    }
  }
} 