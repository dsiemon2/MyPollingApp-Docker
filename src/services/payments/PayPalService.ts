// PayPal Payment Service Module
// Handles all PayPal payment processing

import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ rel: string; href: string }>;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
}

export class PayPalService implements PaymentServiceInterface {
  readonly provider = 'paypal';
  private config: PaymentConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  initialize(config: PaymentConfig): void {
    this.config = config;
  }

  private ensureInitialized(): PaymentConfig {
    if (!this.config) {
      throw new Error('PayPal service not initialized. Call initialize() first.');
    }
    return this.config;
  }

  private getBaseUrl(): string {
    const config = this.ensureInitialized();
    return config.testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.ensureInitialized();
    const baseUrl = this.getBaseUrl();
    const auth = Buffer.from(`${config.publishableKey}:${config.secretKey}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
    }

    const data = await response.json() as PayPalAccessToken;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    return this.accessToken;
  }

  private mapStatus(paypalStatus: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      'CREATED': 'pending',
      'SAVED': 'pending',
      'APPROVED': 'processing',
      'VOIDED': 'canceled',
      'COMPLETED': 'succeeded',
      'PAYER_ACTION_REQUIRED': 'pending',
    };
    return statusMap[paypalStatus] || 'pending';
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: params.currency?.toUpperCase() || 'USD',
          value: params.amount.toFixed(2)
        },
        description: params.description,
        custom_id: params.customerId,
        reference_id: params.metadata?.orderId
      }],
      application_context: {
        brand_name: 'PollChat',
        user_action: 'PAY_NOW',
        return_url: params.metadata?.returnUrl || 'https://localhost/return',
        cancel_url: params.metadata?.cancelUrl || 'https://localhost/cancel'
      }
    };

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal order: ${error}`);
    }

    const order = await response.json() as PayPalOrder;
    const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;

    return {
      id: order.id,
      amount: params.amount,
      currency: params.currency?.toUpperCase() || 'USD',
      status: this.mapStatus(order.status),
      clientSecret: approvalUrl, // Use approval URL as client secret equivalent
      metadata: params.metadata,
      createdAt: new Date()
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve PayPal order: ${response.statusText}`);
    }

    const order = await response.json() as PayPalOrder;
    const purchaseUnit = order.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    return {
      id: order.id,
      amount: capture ? parseFloat(capture.amount.value) : 0,
      currency: capture?.amount.currency_code || 'USD',
      status: this.mapStatus(order.status),
      createdAt: new Date()
    };
  }

  async confirmPayment(paymentIntentId: string, _paymentMethodId: string): Promise<PaymentIntent> {
    // For PayPal, confirmation is done through capture
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paymentIntentId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to capture PayPal order: ${error}`);
    }

    const order = await response.json() as PayPalOrder;
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

    return {
      id: capture?.id || order.id,
      amount: capture ? parseFloat(capture.amount.value) : 0,
      currency: capture?.amount.currency_code || 'USD',
      status: this.mapStatus(order.status),
      createdAt: new Date()
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentIntent> {
    // PayPal doesn't have a direct cancel - orders expire automatically
    const order = await this.retrievePaymentIntent(paymentIntentId);
    return {
      ...order,
      status: 'canceled'
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    // Get the capture ID first
    const order = await this.retrievePaymentIntent(paymentIntentId);

    const refundData: Record<string, unknown> = {};
    if (amount) {
      refundData.amount = {
        value: amount.toFixed(2),
        currency_code: order.currency
      };
    }

    // Assuming paymentIntentId is the capture ID for refunds
    const response = await fetch(`${baseUrl}/v2/payments/captures/${paymentIntentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refundData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refund PayPal capture: ${error}`);
    }

    const data = await response.json() as {
      id: string;
      status: string;
      amount: { value: string };
    };

    return {
      id: data.id,
      amount: parseFloat(data.amount?.value || '0'),
      status: data.status === 'COMPLETED' ? 'succeeded' : data.status === 'PENDING' ? 'pending' : 'failed',
      paymentIntentId
    };
  }

  getPublishableKey(): string {
    const config = this.ensureInitialized();
    return config.publishableKey; // This is the Client ID for PayPal
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }
}

// Export singleton instance
export const paypalService = new PayPalService();
