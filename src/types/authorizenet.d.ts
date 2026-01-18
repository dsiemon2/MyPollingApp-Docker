// Type declarations for authorizenet module
declare module 'authorizenet' {
  export namespace APIContracts {
    class MerchantAuthenticationType {
      setName(name: string): void;
      setTransactionKey(key: string): void;
    }

    class OpaqueDataType {
      setDataDescriptor(descriptor: string): void;
      setDataValue(value: string): void;
    }

    class CreditCardType {
      setCardNumber(number: string): void;
      setExpirationDate(date: string): void;
      setCardCode(code: string): void;
    }

    class BankAccountType {
      setAccountType(type: BankAccountTypeEnum): void;
      setRoutingNumber(number: string): void;
      setAccountNumber(number: string): void;
      setNameOnAccount(name: string): void;
    }

    class PaymentType {
      setOpaqueData(data: OpaqueDataType): void;
      setCreditCard(card: CreditCardType): void;
      setBankAccount(account: BankAccountType): void;
    }

    class TransactionRequestType {
      setTransactionType(type: TransactionTypeEnum): void;
      setPayment(payment: PaymentType): void;
      setAmount(amount: number): void;
      setRefTransId(transId: string): void;
    }

    class CreateTransactionRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransactionRequest(request: TransactionRequestType): void;
      getJSON(): any;
    }

    class CreateTransactionResponse {
      constructor(response: any);
      getMessages(): {
        getResultCode(): MessageTypeEnum;
        getMessage(): Array<{ getText(): string }>;
      };
      getTransactionResponse(): {
        getTransId(): string;
        getResponseCode(): string;
        getErrors?(): {
          getError(): Array<{ getErrorText(): string }>;
        };
      };
    }

    class GetTransactionDetailsRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransId(transId: string): void;
      getJSON(): any;
    }

    class GetTransactionDetailsResponse {
      constructor(response: any);
      getMessages(): {
        getResultCode(): MessageTypeEnum;
        getMessage(): Array<{ getText(): string }>;
      };
      getTransaction(): {
        getTransId(): string;
        getAuthAmount(): string;
        getResponseCode(): string;
        getSubmitTimeUTC(): string;
        getPayment(): {
          getCreditCard(): {
            getCardType(): string;
          };
        };
      };
    }

    enum MessageTypeEnum {
      OK = 'Ok',
      ERROR = 'Error',
    }

    enum TransactionTypeEnum {
      AUTHCAPTURETRANSACTION = 'authCaptureTransaction',
      VOIDTRANSACTION = 'voidTransaction',
      REFUNDTRANSACTION = 'refundTransaction',
    }

    enum BankAccountTypeEnum {
      CHECKING = 'checking',
      SAVINGS = 'savings',
    }
  }

  export namespace APIControllers {
    class CreateTransactionController {
      constructor(json: any);
      execute(callback: () => void): void;
      getResponse(): any;
    }

    class GetTransactionDetailsController {
      constructor(json: any);
      execute(callback: () => void): void;
      getResponse(): any;
    }
  }

  export namespace Constants {
    const endpoint: {
      production: string;
      sandbox: string;
    };
  }
}
