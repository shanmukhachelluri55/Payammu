export interface Coupon {
    id: string;
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    validUntil: string;
    description: string;
    minBillAmount: number;
    userId: string;
  }
  
  export interface CreateCouponData {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    validUntil: string;
    description: string;
    minBillAmount: number;
  }