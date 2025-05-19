export interface Item {
  subVariant: string;
  quantity: any;
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  userId: string;
  stockPosition: number;
  minStock: number;
}


export interface PaymentSplit {
  method: 'CASH' | 'RAZORPAY' | 'UPI';
  amount: number;
}




export interface CartItem extends Item {
  quantity: number;
}

export interface SaleData {
  totalBeforeDiscount: any;
  discountAmount: any;
  billNumber: number;
  items: Item[];
  subtotal: number;
  gst: number;
  gstRate: number;
  serviceCharge: number;
  serviceChargeAmount: number;
  total: number;
  payments: PaymentSplit[];
  timestamp: string;
  userID: number;
}
export interface Bill {
  cancelled_user: ReactNode;
  cancelBill_user_payload_id: ReactNode;
  billname: ReactNode;
  splitpayment: any;
  id: string;
  date: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  gst: number;
  serviceCharge: number;
  serviceChargeAmount: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled' | 'deleted';
  cancellationReason?: string;
  deletedAt?: string;
  paymentMethod:string;
}

export interface BillStats {
  totalOrders: number;
  totalAmount: number;
  cancelledOrders: number;
  cancelledAmount: number;
  deletedOrders: number;
  deletedAmount: number;
}

export interface Item {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
}

export interface CartItem extends Item {
  quantity: number;
}

export type PaymentMethod = {
  type: 'CARD' | 'UPI' | 'CASH';
  amount: number;
};

export interface SaleData {
  timestamp: any;
  gstRate: number;
  serviceChargeAmount: number;
  serviceCharge: number;
  billNumber: any;
  userID: string | null;
  billNo: string;
  dateTime: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  quantity: number;
  payments: PaymentMethod[];
}

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber';