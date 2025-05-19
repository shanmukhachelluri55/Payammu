export interface BillItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Bill {
  id: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: string;
  cancellationReason?: string;
}

export interface BillStats {
  totalOrders: number;
  totalAmount: number;
  cancelledOrders: number;
  cancelledAmount: number;
  deletedOrders: number;
  deletedAmount: number;
}

export interface BillCancelData {
  Login_id: any;
  username: any;
  date: string;
  items: BillItem[];
  total: number;
  paymentMethod: string;
  reason: string;
}

export interface APIBillResponse {
  bill_number: number;
  timestamp: string;
  items: Array<{
    name: string;
    price: string;
    quantity: number;
  }>;
  subtotal: string;
  gst: string;
  total: string;
  status?: string;
  payments: Array<{
    method: string;
  }>;
}

export interface APICancelledBillResponse {
  billId: string;
  date: string;
  items: BillItem[];
  total: string;
  reason: string;
  paymentMethod: string;
}