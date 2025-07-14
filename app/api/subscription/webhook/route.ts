import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SubscriptionService } from '@/lib/subscription/service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing userId or planId in checkout session');
    return;
  }

  try {
    await SubscriptionService.updateSubscription(userId, {
      planId,
      status: 'active',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      cancelAtPeriodEnd: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    console.log(`Subscription activated for user ${userId} with plan ${planId}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  try {
    await SubscriptionService.updateSubscription(userId, {
      status: subscription.status as any,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } as any);

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  try {
    // Downgrade to free plan
    await SubscriptionService.updateSubscription(userId, {
      planId: 'free',
      status: 'inactive',
      stripeSubscriptionId: undefined,
      cancelAtPeriodEnd: false,
    } as any);

    console.log(`Subscription canceled for user ${userId}, downgraded to free`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // For now, just log the payment failure
  // In a production app, you'd want to notify the user and update their subscription status
  console.log('Payment failed for invoice:', invoice.id);
  
  // You could implement additional logic here to handle failed payments
  // For example, sending an email to the user or updating subscription status
}
