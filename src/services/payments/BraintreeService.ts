// Braintree Payment Service Module (PayPal)
// Handles all Braintree/PayPal payment processing

import braintree, { BraintreeGateway, Environment } from 'braintree';
import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';

export class BraintreeService implements PaymentServiceInterface {
  readonly provider = 'braintree';
  private gateway: BraintreeGateway | null = null;
  private config: PaymentConfig | null = null;

  initialize(config: PaymentConfig): void {
    this.config = config;
    this.gateway = new braintree.BraintreeGateway({
      environment: config.testMode ? Environment.Sandbox : Environment.Production,
      merchantId: config.merchantId || '',
      publicKey: config.publishableKey,
      privateKey: config.secretKey,
    });
  }

  private ensureInitialized(): BraintreeGateway {
    if (!this.gateway || !this.config) {
      throw new Error('Braintree service not initialized. Call initialize() first.');
    }
    return this.gateway;
  }

  private mapStatus(braintreeStatus: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      'authorized': 'pending',
      'authorizing': 'processing',
      'submitted_for_settlement': 'processing',
      'settling': 'processing',
      'settled': 'succeeded',
      'settlement_confirmed': 'succeeded',
      'voided': 'canceled',
      'failed': 'failed',
      'gateway_rejected': 'failed',
      'processor_declined': 'failed',
    };
    return statusMap[braintreeStatus] || 'pending';
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    const gateway = this.ensureInitialized();

    // Generate client token for frontend
    const clientTokenResponse = await gateway.clientToken.generate({});

    // Return a pending payment intent with client token
    return {
      id: `bt_pending_${Date.now()}`,
      amount: params.amount,
      currency: params.currency?.toUpperCase() || 'USD',
      status: 'pending',
      clientSecret: clientTokenResponse.clientToken,
      metadata: params.metadata,
      createdAt: new Date(),
    };
  }

  async retrievePaymentIntent(transactionId: string): Promise<PaymentIntent> {
    const gateway = this.ensureInitialized();

    const transaction = await gateway.transaction.find(transactionId);

    return {
      id: transaction.id,
      amount: parseFloat(transaction.amount),
      currency: transaction.currencyIsoCode || 'USD',
      status: this.mapStatus(transaction.status),
      paymentMethod: transaction.paymentInstrumentType,
      metadata: transaction.customFields as Record<string, string>,
      createdAt: new Date(transaction.createdAt),
    };
  }

  async confirmPayment(paymentIntentId: string, paymentMethodNonce: string): Promise<PaymentIntent> {
    const gateway = this.ensureInitialized();

    // Extract amount from pending intent ID or use stored value
    // In production, you'd store this in a database
    const amount = '10.00'; // This should come from your stored intent

    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (!result.success || !result.transaction) {
      throw new Error(result.message || 'Payment failed');
    }

    return {
      id: result.transaction.id,
      amount: parseFloat(result.transaction.amount),
      currency: result.transaction.currencyIsoCode || 'USD',
      status: this.mapStatus(result.transaction.status),
      paymentMethod: result.transaction.paymentInstrumentType,
      createdAt: new Date(result.transaction.createdAt),
    };
  }

  async cancelPayment(transactionId: string): Promise<PaymentIntent> {
    const gateway = this.ensureInitialized();

    const result = await gateway.transaction.void(transactionId);

    if (!result.success || !result.transaction) {
      throw new Error(result.message || 'Void failed');
    }

    return {
      id: result.transaction.id,
      amount: parseFloat(result.transaction.amount),
      currency: result.transaction.currencyIsoCode || 'USD',
      status: 'canceled',
      createdAt: new Date(result.transaction.createdAt),
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    const gateway = this.ensureInitialized();

    const refundParams: { transactionId: string; amount?: string } = {
      transactionId,
    };

    if (amount) {
      refundParams.amount = amount.toFixed(2);
    }

    const result = await gateway.transaction.refund(transactionId, amount?.toFixed(2));

    if (!result.success || !result.transaction) {
      throw new Error(result.message || 'Refund failed');
    }

    return {
      id: result.transaction.id,
      amount: parseFloat(result.transaction.amount),
      status: 'succeeded',
      paymentIntentId: transactionId,
    };
  }

  getPublishableKey(): string {
    if (!this.config) {
      throw new Error('Braintree service not initialized.');
    }
    return this.config.publishableKey;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  // Braintree-specific methods

  async generateClientToken(customerId?: string): Promise<string> {
    const gateway = this.ensureInitialized();

    const params: { customerId?: string } = {};
    if (customerId) {
      params.customerId = customerId;
    }

    const response = await gateway.clientToken.generate(params);
    return response.clientToken;
  }

  async createCustomer(email: string, firstName?: string, lastName?: string): Promise<string> {
    const gateway = this.ensureInitialized();

    const result = await gateway.customer.create({
      email,
      firstName,
      lastName,
    });

    if (!result.success || !result.customer) {
      throw new Error(result.message || 'Failed to create customer');
    }

    return result.customer.id;
  }

  async processPayPalPayment(amount: number, paymentMethodNonce: string): Promise<PaymentIntent> {
    const gateway = this.ensureInitialized();

    const result = await gateway.transaction.sale({
      amount: amount.toFixed(2),
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
        paypal: {
          description: 'Payment via PayPal',
        },
      },
    });

    if (!result.success || !result.transaction) {
      throw new Error(result.message || 'PayPal payment failed');
    }

    return {
      id: result.transaction.id,
      amount: parseFloat(result.transaction.amount),
      currency: result.transaction.currencyIsoCode || 'USD',
      status: this.mapStatus(result.transaction.status),
      paymentMethod: 'paypal',
      createdAt: new Date(result.transaction.createdAt),
    };
  }
}

// Export singleton instance
export const braintreeService = new BraintreeService();
