// Payment service types and interfaces

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  clientSecret?: string;
  paymentMethod?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paymentIntentId: string;
}

export interface PaymentConfig {
  provider: 'stripe' | 'paypal' | 'braintree' | 'square' | 'authorize';
  publishableKey: string;
  secretKey: string;
  testMode: boolean;
  webhookSecret?: string;
  merchantId?: string;
  achEnabled?: boolean;
}

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}

export interface PaymentServiceInterface {
  readonly provider: string;

  initialize(config: PaymentConfig): void;

  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>;

  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

  confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent>;

  cancelPayment(paymentIntentId: string): Promise<PaymentIntent>;

  refundPayment(paymentIntentId: string, amount?: number): Promise<RefundResult>;

  getPublishableKey(): string;

  isTestMode(): boolean;
}
