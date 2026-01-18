// Payment Manager - Factory for payment services
// Manages payment provider selection and configuration

import { prisma } from '@/lib/prisma';
import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';
import { StripeService } from './StripeService';
import { PayPalService } from './PayPalService';
import { BraintreeService } from './BraintreeService';
import { SquareService } from './SquareService';
import { AuthorizeNetService } from './AuthorizeNetService';

type ProviderName = 'stripe' | 'paypal' | 'braintree' | 'square' | 'authorize';

export class PaymentManager {
  private services: Map<ProviderName, PaymentServiceInterface> = new Map();
  private activeProvider: ProviderName | null = null;
  private initialized = false;

  constructor() {
    // Register all payment services
    this.services.set('stripe', new StripeService());
    this.services.set('paypal', new PayPalService());
    this.services.set('braintree', new BraintreeService());
    this.services.set('square', new SquareService());
    this.services.set('authorize', new AuthorizeNetService());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load payment gateway configurations from database
      const gateways = await prisma.paymentGateway.findMany({
        where: { isEnabled: true },
      });

      for (const gateway of gateways) {
        const provider = gateway.provider as ProviderName;
        const service = this.services.get(provider);

        if (service) {
          const config: PaymentConfig = {
            provider,
            publishableKey: gateway.publishableKey || '',
            secretKey: gateway.secretKey || '',
            testMode: gateway.testMode,
            webhookSecret: gateway.webhookSecret || undefined,
            merchantId: gateway.merchantId || undefined,
            achEnabled: gateway.achEnabled,
          };

          service.initialize(config);

          // Set the first enabled provider as active
          if (!this.activeProvider) {
            this.activeProvider = provider;
          }
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PaymentManager:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('PaymentManager not initialized. Call initialize() first.');
    }
  }

  getActiveProvider(): ProviderName | null {
    return this.activeProvider;
  }

  setActiveProvider(provider: ProviderName): void {
    if (!this.services.has(provider)) {
      throw new Error(`Unknown payment provider: ${provider}`);
    }
    this.activeProvider = provider;
  }

  getService(provider?: ProviderName): PaymentServiceInterface {
    this.ensureInitialized();

    const targetProvider = provider || this.activeProvider;
    if (!targetProvider) {
      throw new Error('No active payment provider configured');
    }

    const service = this.services.get(targetProvider);
    if (!service) {
      throw new Error(`Payment service not found: ${targetProvider}`);
    }

    return service;
  }

  // Proxy methods to active provider

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    return this.getService().createPaymentIntent(params);
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    return this.getService().retrievePaymentIntent(paymentIntentId);
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    return this.getService().confirmPayment(paymentIntentId, paymentMethodId);
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentIntent> {
    return this.getService().cancelPayment(paymentIntentId);
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    return this.getService().refundPayment(paymentIntentId, amount);
  }

  getPublishableKey(): string {
    return this.getService().getPublishableKey();
  }

  isTestMode(): boolean {
    return this.getService().isTestMode();
  }

  // Get all available providers
  getAvailableProviders(): ProviderName[] {
    return Array.from(this.services.keys());
  }

  // Get provider-specific service
  getStripeService(): StripeService {
    return this.services.get('stripe') as StripeService;
  }

  getPayPalService(): PayPalService {
    return this.services.get('paypal') as PayPalService;
  }

  getBraintreeService(): BraintreeService {
    return this.services.get('braintree') as BraintreeService;
  }

  getSquareService(): SquareService {
    return this.services.get('square') as SquareService;
  }

  getAuthorizeNetService(): AuthorizeNetService {
    return this.services.get('authorize') as AuthorizeNetService;
  }
}

// Export singleton instance
export const paymentManager = new PaymentManager();

// Helper function to get initialized payment manager
export async function getPaymentManager(): Promise<PaymentManager> {
  await paymentManager.initialize();
  return paymentManager;
}
