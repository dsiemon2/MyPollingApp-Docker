// Authorize.net Payment Service Module
// Handles all Authorize.net payment processing

import { APIContracts, APIControllers, Constants } from 'authorizenet';
import {
  PaymentServiceInterface,
  PaymentConfig,
  PaymentIntent,
  RefundResult,
  CreatePaymentParams,
} from './types';

export class AuthorizeNetService implements PaymentServiceInterface {
  readonly provider = 'authorize';
  private config: PaymentConfig | null = null;
  private merchantAuth: APIContracts.MerchantAuthenticationType | null = null;

  initialize(config: PaymentConfig): void {
    this.config = config;
    this.merchantAuth = new APIContracts.MerchantAuthenticationType();
    this.merchantAuth.setName(config.publishableKey); // API Login ID
    this.merchantAuth.setTransactionKey(config.secretKey); // Transaction Key

    // Set environment
    if (config.testMode) {
      Constants.endpoint.production = Constants.endpoint.sandbox;
    }
  }

  private ensureInitialized(): APIContracts.MerchantAuthenticationType {
    if (!this.merchantAuth || !this.config) {
      throw new Error('Authorize.net service not initialized. Call initialize() first.');
    }
    return this.merchantAuth;
  }

  private mapStatus(responseCode: string): PaymentIntent['status'] {
    const statusMap: Record<string, PaymentIntent['status']> = {
      '1': 'succeeded', // Approved
      '2': 'failed',    // Declined
      '3': 'failed',    // Error
      '4': 'pending',   // Held for Review
    };
    return statusMap[responseCode] || 'pending';
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    // Authorize.net doesn't have PaymentIntents
    // Return a pending intent that will be used with Accept.js on frontend
    const intentId = `authnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: intentId,
      amount: params.amount,
      currency: params.currency?.toUpperCase() || 'USD',
      status: 'pending',
      clientSecret: this.config?.publishableKey, // API Login ID for Accept.js
      metadata: params.metadata,
      createdAt: new Date(),
    };
  }

  async retrievePaymentIntent(transactionId: string): Promise<PaymentIntent> {
    const merchantAuth = this.ensureInitialized();

    const getRequest = new APIContracts.GetTransactionDetailsRequest();
    getRequest.setMerchantAuthentication(merchantAuth);
    getRequest.setTransId(transactionId);

    const ctrl = new APIControllers.GetTransactionDetailsController(getRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.GetTransactionDetailsResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          reject(new Error(apiResponse.getMessages().getMessage()[0].getText()));
          return;
        }

        const transaction = apiResponse.getTransaction();

        resolve({
          id: transaction.getTransId(),
          amount: parseFloat(transaction.getAuthAmount()),
          currency: 'USD',
          status: this.mapStatus(transaction.getResponseCode()),
          paymentMethod: transaction.getPayment()?.getCreditCard()?.getCardType(),
          createdAt: new Date(transaction.getSubmitTimeUTC()),
        });
      });
    });
  }

  async confirmPayment(intentId: string, opaqueData: string): Promise<PaymentIntent> {
    const merchantAuth = this.ensureInitialized();

    // Parse opaque data (from Accept.js)
    const { dataDescriptor, dataValue, amount } = JSON.parse(opaqueData);

    // Create opaque data type
    const opaqueDataType = new APIContracts.OpaqueDataType();
    opaqueDataType.setDataDescriptor(dataDescriptor);
    opaqueDataType.setDataValue(dataValue);

    // Create payment type
    const paymentType = new APIContracts.PaymentType();
    paymentType.setOpaqueData(opaqueDataType);

    // Create transaction request
    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setPayment(paymentType);
    transactionRequest.setAmount(amount);

    // Create the request
    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.CreateTransactionResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          const transResponse = apiResponse.getTransactionResponse();
          const errors = transResponse?.getErrors?.();
          const errorText = errors ? errors.getError()[0].getErrorText() : 'Transaction failed';
          reject(new Error(errorText));
          return;
        }

        const transactionResponse = apiResponse.getTransactionResponse();

        resolve({
          id: transactionResponse.getTransId(),
          amount: amount,
          currency: 'USD',
          status: this.mapStatus(transactionResponse.getResponseCode()),
          paymentMethod: 'card',
          createdAt: new Date(),
        });
      });
    });
  }

  async cancelPayment(transactionId: string): Promise<PaymentIntent> {
    const merchantAuth = this.ensureInitialized();

    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.VOIDTRANSACTION);
    transactionRequest.setRefTransId(transactionId);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.CreateTransactionResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          reject(new Error('Void failed'));
          return;
        }

        resolve({
          id: apiResponse.getTransactionResponse().getTransId(),
          amount: 0,
          currency: 'USD',
          status: 'canceled',
          createdAt: new Date(),
        });
      });
    });
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    const merchantAuth = this.ensureInitialized();

    // First get the original transaction to get card info
    const originalTransaction = await this.retrievePaymentIntent(transactionId);

    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.REFUNDTRANSACTION);
    transactionRequest.setRefTransId(transactionId);

    if (amount) {
      transactionRequest.setAmount(amount);
    } else {
      transactionRequest.setAmount(originalTransaction.amount);
    }

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.CreateTransactionResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          reject(new Error('Refund failed'));
          return;
        }

        resolve({
          id: apiResponse.getTransactionResponse().getTransId(),
          amount: amount || originalTransaction.amount,
          status: 'succeeded',
          paymentIntentId: transactionId,
        });
      });
    });
  }

  getPublishableKey(): string {
    if (!this.config) {
      throw new Error('Authorize.net service not initialized.');
    }
    return this.config.publishableKey;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  // Authorize.net-specific methods

  async chargeCard(
    amount: number,
    cardNumber: string,
    expirationDate: string,
    cardCode: string
  ): Promise<PaymentIntent> {
    const merchantAuth = this.ensureInitialized();

    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(cardNumber);
    creditCard.setExpirationDate(expirationDate);
    creditCard.setCardCode(cardCode);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setPayment(paymentType);
    transactionRequest.setAmount(amount);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.CreateTransactionResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          const transResponse = apiResponse.getTransactionResponse();
          const errors = transResponse?.getErrors?.();
          const errorText = errors ? errors.getError()[0].getErrorText() : 'Transaction failed';
          reject(new Error(errorText));
          return;
        }

        const transactionResponse = apiResponse.getTransactionResponse();

        resolve({
          id: transactionResponse.getTransId(),
          amount,
          currency: 'USD',
          status: this.mapStatus(transactionResponse.getResponseCode()),
          paymentMethod: 'card',
          createdAt: new Date(),
        });
      });
    });
  }

  async processECheck(
    amount: number,
    routingNumber: string,
    accountNumber: string,
    nameOnAccount: string,
    accountType: 'checking' | 'savings' = 'checking'
  ): Promise<PaymentIntent> {
    const merchantAuth = this.ensureInitialized();

    const bankAccount = new APIContracts.BankAccountType();
    bankAccount.setAccountType(
      accountType === 'checking'
        ? APIContracts.BankAccountTypeEnum.CHECKING
        : APIContracts.BankAccountTypeEnum.SAVINGS
    );
    bankAccount.setRoutingNumber(routingNumber);
    bankAccount.setAccountNumber(accountNumber);
    bankAccount.setNameOnAccount(nameOnAccount);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setBankAccount(bankAccount);

    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setPayment(paymentType);
    transactionRequest.setAmount(amount);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuth);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const response = ctrl.getResponse();
        const apiResponse = new APIContracts.CreateTransactionResponse(response);

        if (apiResponse.getMessages().getResultCode() !== APIContracts.MessageTypeEnum.OK) {
          reject(new Error('eCheck transaction failed'));
          return;
        }

        resolve({
          id: apiResponse.getTransactionResponse().getTransId(),
          amount,
          currency: 'USD',
          status: this.mapStatus(apiResponse.getTransactionResponse().getResponseCode()),
          paymentMethod: 'bank_account',
          createdAt: new Date(),
        });
      });
    });
  }

  getAcceptJsUrl(): string {
    return this.config?.testMode
      ? 'https://jstest.authorize.net/v1/Accept.js'
      : 'https://js.authorize.net/v1/Accept.js';
  }
}

// Export singleton instance
export const authorizeNetService = new AuthorizeNetService();
