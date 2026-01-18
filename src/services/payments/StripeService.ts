// Stripe Payment Service Module
// Handles all Stripe payment processing

import Stripe from 'stripe';
import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';

export class StripeService implements PaymentServiceInterface {
  readonly provider = 'stripe';
  private stripe: Stripe | null = null;
  private config: PaymentConfig | null = null;

  initialize(config: PaymentConfig): void {
    this.config = config;
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  private ensureInitialized(): Stripe {
    if (!this.stripe || !this.config) {
      throw new Error('Stripe service not initialized. Call initialize() first.');
    }
    return this.stripe;
  }

  private convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private convertFromCents(cents: number): number {
    return cents / 100;
  }

  private mapStatus(stripeStatus: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'canceled',
    };
    return statusMap[stripeStatus] || 'pending';
  }

  private mapPaymentIntent(intent: Stripe.PaymentIntent): PaymentIntent {
    return {
      id: intent.id,
      amount: this.convertFromCents(intent.amount),
      currency: intent.currency.toUpperCase(),
      status: this.mapStatus(intent.status),
      clientSecret: intent.client_secret || undefined,
      paymentMethod: typeof intent.payment_method === 'string'
        ? intent.payment_method
        : intent.payment_method?.id,
      metadata: intent.metadata as Record<string, string>,
      createdAt: new Date(intent.created * 1000),
    };
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    const stripe = this.ensureInitialized();

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: this.convertToCents(params.amount),
      currency: params.currency?.toLowerCase() || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: params.metadata || {},
    };

    if (params.description) {
      paymentIntentParams.description = params.description;
    }

    if (params.customerId) {
      paymentIntentParams.customer = params.customerId;
    }

    const intent = await stripe.paymentIntents.create(paymentIntentParams);
    return this.mapPaymentIntent(intent);
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const stripe = this.ensureInitialized();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return this.mapPaymentIntent(intent);
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    const stripe = this.ensureInitialized();
    const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
    return this.mapPaymentIntent(intent);
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const stripe = this.ensureInitialized();
    const intent = await stripe.paymentIntents.cancel(paymentIntentId);
    return this.mapPaymentIntent(intent);
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    const stripe = this.ensureInitialized();

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = this.convertToCents(amount);
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      id: refund.id,
      amount: refund.amount ? this.convertFromCents(refund.amount) : 0,
      status: refund.status === 'succeeded' ? 'succeeded' : refund.status === 'pending' ? 'pending' : 'failed',
      paymentIntentId,
    };
  }

  getPublishableKey(): string {
    if (!this.config) {
      throw new Error('Stripe service not initialized.');
    }
    return this.config.publishableKey;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  // Stripe-specific methods

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<string> {
    const stripe = this.ensureInitialized();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer.id;
  }

  async createSetupIntent(customerId: string): Promise<{ id: string; clientSecret: string }> {
    const stripe = this.ensureInitialized();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return {
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret || '',
    };
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const stripe = this.ensureInitialized();
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return methods.data;
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    const stripe = this.ensureInitialized();
    if (!this.config?.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    return stripe.webhooks.constructEvent(payload, signature, this.config.webhookSecret);
  }
}

// Export singleton instance
export const stripeService = new StripeService();
