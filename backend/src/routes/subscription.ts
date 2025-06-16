import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Get subscription plans
router.get('/plans', async (req: Request, res: Response) => {
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
  } catch (error) {
    logger.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create subscription
router.post('/create',
  [
    body('planId').isIn(['basic', 'professional', 'enterprise']),
    body('paymentMethodId').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
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
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customer = customers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: userEmail,
            payment_method: paymentMethodId,
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }
      } catch (stripeError) {
        logger.error('Stripe customer error:', stripeError);
        return res.status(400).json({ message: 'Error creating customer' });
      }

      // Get price ID based on plan
      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
      };

      const priceId = priceIds[planId as keyof typeof priceIds];
      if (!priceId) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      // Create subscription
      try {
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          expand: ['latest_invoice.payment_intent'],
        });

        res.status(201).json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          status: subscription.status,
        });
      } catch (stripeError) {
        logger.error('Stripe subscription error:', stripeError);
        return res.status(400).json({ message: 'Error creating subscription' });
      }
    } catch (error) {
      logger.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current subscription
router.get('/current', async (req: Request, res: Response) => {
  try {
    // TODO: Get user from auth context
    const userEmail = 'user@example.com';

    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json({ subscription: null });
    }

    const subscriptions = await stripe.subscriptions.list({
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
  } catch (error) {
    logger.error('Error fetching current subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAt: subscription.cancel_at,
      },
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      logger.info('Payment succeeded:', event.data.object.id);
      // TODO: Update user subscription status
      break;
    case 'invoice.payment_failed':
      logger.warn('Payment failed:', event.data.object.id);
      // TODO: Handle failed payment
      break;
    case 'customer.subscription.deleted':
      logger.info('Subscription deleted:', event.data.object.id);
      // TODO: Deactivate user account
      break;
    default:
      logger.warn('Unhandled event type:', event.type);
  }

  res.json({ received: true });
});

export default router; 