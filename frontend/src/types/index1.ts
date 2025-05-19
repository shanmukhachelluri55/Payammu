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

export interface Bill {
  id: number;
  cart: CartItem[];
  gstRate: number;
  serviceCharge: number;
  discountAmount: number; // Added field to store discount amount
}
