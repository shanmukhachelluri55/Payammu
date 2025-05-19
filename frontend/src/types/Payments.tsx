export interface PaymentSplit {
    method: 'CASH' | 'CARD' | 'UPI';
    amount: number;
  }
  
  export interface Customer {
    name: string;
    phone: string;
    royalty_points: number;
  }
  
  export interface PaymentModalProps {
    total: number;
    remainingAmount: number;
    currentPayment: PaymentSplit;
    payments: PaymentSplit[];
    onPaymentMethodSelect: (method: 'CASH' | 'CARD' | 'UPI') => void;
    onPaymentAmountChange: (amount: number) => void;
    onAddPayment: () => void;
    onBack: () => void;
  }