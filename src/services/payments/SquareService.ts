// Square Payment Service Module
// Handles all Square payment processing

import { Client, Environment, ApiError } from 'square';
import { randomUUID } from 'crypto';
import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';

export class SquareService implements PaymentServiceInterface {
  readonly provider = 'square';
  private client: Client | null = null;
  private config: PaymentConfig | null = null;

  initialize(config: PaymentConfig): void {
    this.config = config;
    this.client = new Client({
      accessToken: config.secretKey,
      environment: config.testMode ? Environment.Sandbox : Environment.Production,
    });
  }

  private ensureInitialized(): Client {
    if (!this.client || !this.config) {
      throw new Error('Square service not initialized. Call initialize() first.');
    }
    return this.client;
  }

  private convertToCents(amount: number): bigint {
    return BigInt(Math.round(amount * 100));
  }

  private convertFromCents(cents: bigint): number {
    return Number(cents) / 100;
  }

  private mapStatus(squareStatus: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      'APPROVED': 'processing',
      'PENDING': 'pending',
      'COMPLETED': 'succeeded',
      'CANCELED': 'canceled',
      'FAILED': 'failed',
    };
    return statusMap[squareStatus] || 'pending';
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    // Square doesn't have a PaymentIntent equivalent
    // We return a pending intent that will be completed when the frontend sends the source_id
    const intentId = `sq_intent_${randomUUID()}`;

    return {
      id: intentId,
      amount: params.amount,
      currency: params.currency?.toUpperCase() || 'USD',
      status: 'pending',
      clientSecret: this.config?.publishableKey, // Application ID for frontend
      metadata: params.metadata,
      createdAt: new Date(),
    };
  }

  async retrievePaymentIntent(paymentId: string): Promise<PaymentIntent> {
    const client = this.ensureInitialized();

    const { result } = await client.paymentsApi.getPayment(paymentId);
    const payment = result.payment;

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      id: payment.id || '',
      amount: payment.amountMoney?.amount ? this.convertFromCents(payment.amountMoney.amount) : 0,
      currency: payment.amountMoney?.currency || 'USD',
      status: this.mapStatus(payment.status || ''),
      paymentMethod: payment.sourceType,
      createdAt: new Date(payment.createdAt || Date.now()),
    };
  }

  async confirmPayment(intentId: string, sourceId: string): Promise<PaymentIntent> {
    const client = this.ensureInitialized();

    // For Square, we need the amount which should be stored with the intent
    // In production, you'd retrieve this from your database
    // Here we'll extract from metadata or use a default

    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(1000), // This should come from stored intent
        currency: 'USD',
      },
    });

    const payment = result.payment;

    if (!payment) {
      throw new Error('Payment creation failed');
    }

    return {
      id: payment.id || '',
      amount: payment.amountMoney?.amount ? this.convertFromCents(payment.amountMoney.amount) : 0,
      currency: payment.amountMoney?.currency || 'USD',
      status: this.mapStatus(payment.status || ''),
      paymentMethod: payment.sourceType,
      createdAt: new Date(payment.createdAt || Date.now()),
    };
  }

  async cancelPayment(paymentId: string): Promise<PaymentIntent> {
    const client = this.ensureInitialized();

    const { result } = await client.paymentsApi.cancelPayment(paymentId);
    const payment = result.payment;

    if (!payment) {
      throw new Error('Payment cancellation failed');
    }

    return {
      id: payment.id || '',
      amount: payment.amountMoney?.amount ? this.convertFromCents(payment.amountMoney.amount) : 0,
      currency: payment.amountMoney?.currency || 'USD',
      status: 'canceled',
      createdAt: new Date(payment.createdAt || Date.now()),
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    const client = this.ensureInitialized();

    // For Square, we need to get the original payment to determine refund amount if not specified
    let refundAmount = amount;
    if (!refundAmount) {
      const originalPayment = await this.retrievePaymentIntent(paymentId);
      refundAmount = originalPayment.amount;
    }

    const { result } = await client.refundsApi.refundPayment({
      idempotencyKey: randomUUID(),
      paymentId,
      amountMoney: {
        amount: this.convertToCents(refundAmount),
        currency: 'USD',
      },
    });
    const refund = result.refund;

    if (!refund) {
      throw new Error('Refund failed');
    }

    return {
      id: refund.id || '',
      amount: refund.amountMoney?.amount ? this.convertFromCents(refund.amountMoney.amount) : 0,
      status: refund.status === 'COMPLETED' ? 'succeeded' : refund.status === 'PENDING' ? 'pending' : 'failed',
      paymentIntentId: paymentId,
    };
  }

  getPublishableKey(): string {
    if (!this.config) {
      throw new Error('Square service not initialized.');
    }
    return this.config.publishableKey;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  // Square-specific methods

  async processPayment(
    amount: number,
    sourceId: string,
    currency: string = 'USD',
    note?: string
  ): Promise<PaymentIntent> {
    const client = this.ensureInitialized();

    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: this.convertToCents(amount),
        currency,
      },
      note,
    });

    const payment = result.payment;

    if (!payment) {
      throw new Error('Payment failed');
    }

    return {
      id: payment.id || '',
      amount: payment.amountMoney?.amount ? this.convertFromCents(payment.amountMoney.amount) : 0,
      currency: payment.amountMoney?.currency || currency,
      status: this.mapStatus(payment.status || ''),
      paymentMethod: payment.sourceType,
      createdAt: new Date(payment.createdAt || Date.now()),
    };
  }

  async createCustomer(email: string, givenName?: string, familyName?: string): Promise<string> {
    const client = this.ensureInitialized();

    const { result } = await client.customersApi.createCustomer({
      emailAddress: email,
      givenName,
      familyName,
      idempotencyKey: randomUUID(),
    });

    if (!result.customer?.id) {
      throw new Error('Failed to create customer');
    }

    return result.customer.id;
  }

  async listLocations(): Promise<Array<{ id: string; name: string }>> {
    const client = this.ensureInitialized();

    const { result } = await client.locationsApi.listLocations();

    return (result.locations || []).map(loc => ({
      id: loc.id || '',
      name: loc.name || '',
    }));
  }
}

// Export singleton instance
export const squareService = new SquareService();
