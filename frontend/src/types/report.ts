export interface SaleItem {
    id: number;
    bill_number: number;
    name: string;
    price: string;
    image: string;
    category: string;
    available: boolean;
    quantity: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Payment {
    id: number;
    bill_number: number;
    method: string;
    amount: string;
  }
  
  export interface Bill {
    bill_number: number;
    subtotal: string;
    gst: string;
    gst_rate: string;
    total: string;
    timestamp: string;
    user_id: number;
    items: SaleItem[];
    payments: Payment[];
  }