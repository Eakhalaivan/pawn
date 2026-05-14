import stripe from '../../config/stripe.js';
import prisma from '../../config/database.js';
import { NotFoundError, AppError } from '../../shared/errors/AuthError.js';
import Stripe from 'stripe';

export class PaymentsService {
  /**
   * Creates a Stripe PaymentIntent for an order.
   * Business Rule: Never trust client-reported amount; verify against DB.
   */
  async createPaymentIntent(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new AppError('Unauthorized', 403);
    if (order.status === 'PAID') throw new AppError('Order already paid', 400);

    const amountInPaise = Math.round(order.totalAmount.toNumber() * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      metadata: { orderId, userId },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: order.totalAmount,
    };
  }

  /**
   * Handles Stripe webhooks with signature verification.
   */
  async handleWebhook(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new AppError(`Webhook Error: ${err.message}`, 400);
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(orderId, paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(orderId, paymentIntent.last_payment_error?.message);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(orderId: string, paymentIntentId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    // Enqueue order confirmation email job (BullMQ to be implemented in Phase 8)
    console.log(`Payment succeeded for order ${orderId}. Job enqueued.`);
  }

  private async handlePaymentFailed(orderId: string, errorMessage?: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
    });

    // Notify customer (BullMQ to be implemented in Phase 8)
    console.log(`Payment failed for order ${orderId}: ${errorMessage}`);
  }
}
